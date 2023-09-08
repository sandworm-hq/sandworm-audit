const {getDependencyVulnerabilities} = require('./issues/vulnerabilities');
const {getLicenseIssues, getLicenseUsage, getLicenseCategories} = require('./issues/license');
const {buildTree, buildTreemap} = require('./charts');
const {excludeResolved, validateResolvedIssues, allIssuesFromReport} = require('./issues/utils');
const csv = require('./charts/csv');
const {getMetaIssues} = require('./issues/meta');
const validateConfig = require('./validateConfig');
const getDependencyGraph = require('./graph');
const {addDependencyGraphData} = require('./graph/utils');
const {loadResolvedIssues} = require('./files');
const {getRegistryAudit, setupRegistries} = require('./registry');

const getReport = async ({
  appPath,
  dependencyGraph,
  includeDev = false,
  licensePolicy,
  loadDataFrom = 'registry',
  maxDepth = 7,
  minDisplayedSeverity = 'high',
  onProgress = () => {},
  output = ['tree', 'treemap', 'csv'],
  rootIsShell = false,
  skipLicenseIssues = false,
  skipMetaIssues = false,
  includeRootVulnerabilities = false,
  forceBuildLargeTrees = false,
  showVersions = false,
  width = 1500,
} = {}) => {
  validateConfig({
    appPath,
    dependencyGraph,
    licensePolicy,
    loadDataFrom,
    maxDepth,
    minDisplayedSeverity,
    onProgress,
    output,
    width,
  });

  let errors = [];

  // Generate the dependency graph
  onProgress({type: 'start', stage: 'graph'});
  await setupRegistries(appPath);
  const dGraph =
    dependencyGraph ||
    (await getDependencyGraph(appPath, {
      loadDataFrom,
      rootIsShell,
      includeDev,
      onProgress: (progress) => onProgress({type: 'progress', stage: 'graph', progress}),
    }));
  const packageGraph = dGraph.root;
  errors = [...errors, ...(dGraph.errors || [])];
  onProgress({type: 'end', stage: 'graph'});

  // Get vulnerabilities
  onProgress({type: 'start', stage: 'vulnerabilities'});
  let dependencyVulnerabilities;
  let rootVulnerabilities;
  let licenseUsage;
  let licenseIssues;
  let metaIssues;

  try {
    dependencyVulnerabilities = await getDependencyVulnerabilities({
      appPath,
      packageManager: packageGraph.meta.packageManager,
      packageGraph,
      includeDev,
      onProgress: (message) => onProgress({type: 'update', stage: 'vulnerabilities', message}),
    });

    if (!includeDev) {
      dependencyVulnerabilities = (dependencyVulnerabilities || []).filter((issue) =>
        (issue?.findings?.sources || []).find(({flags}) => flags.prod),
      );
    }
  } catch (error) {
    errors.push(error);
  }

  if (includeRootVulnerabilities) {
    if (!packageGraph.name || !packageGraph.version) {
      errors.push(
        new Error('Cannot scan root vulnerabilities: root package name and version are required.'),
      );
    } else {
      try {
        rootVulnerabilities = await getRegistryAudit({
          packageManager: packageGraph.meta.packageManager,
          packageName: packageGraph.name,
          packageVersion: packageGraph.version,
          packageGraph,
          includeDev,
        });
      } catch (error) {
        errors.push(error);
      }
    }
  }
  onProgress({type: 'end', stage: 'vulnerabilities'});

  if (!skipLicenseIssues) {
    // Get license info and issues
    onProgress({type: 'start', stage: 'licenses'});
    try {
      const {defaultCategories, userCategories} = getLicenseCategories(licensePolicy);
      licenseUsage = await getLicenseUsage({
        dependencies: includeDev ? dGraph.all : dGraph.prodDependencies,
        defaultCategories,
        userCategories,
      });
      licenseIssues = await getLicenseIssues({
        licenseUsage,
        packageGraph,
        licensePolicy,
        includeDev,
      });
    } catch (error) {
      errors.push(error);
    }
    onProgress({type: 'end', stage: 'licenses'});
  }

  if (!skipMetaIssues) {
    // Get meta issues
    onProgress({type: 'start', stage: 'issues'});
    try {
      metaIssues = await getMetaIssues({
        dependencies: includeDev ? dGraph.all : dGraph.prodDependencies,
        packageGraph,
        workspace: dGraph.workspace,
        includeDev,
      });
    } catch (error) {
      errors.push(error);
    }
    onProgress({type: 'end', stage: 'issues'});
  }

  const SEVERITIES = ['critical', 'high', 'moderate', 'low'];
  const sortBySeverity = (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
  const filteredIssues = (dependencyVulnerabilities || [])
    .concat(rootVulnerabilities || [])
    .concat(metaIssues || [])
    .concat(licenseIssues || [])
    .filter(
      ({severity}) => SEVERITIES.indexOf(severity) <= SEVERITIES.indexOf(minDisplayedSeverity),
    )
    .sort(sortBySeverity);

  const options = {
    showVersions,
    width,
    maxDepth,
    issues: filteredIssues,
    includeDev,
    forceBuildLargeTrees,
    onProgress: (message) => onProgress({type: 'update', stage: 'chart', message}),
  };

  // Generate charts
  const svgs = {};
  if (output.includes('tree')) {
    onProgress({type: 'start', stage: 'tree'});
    svgs.tree = await buildTree(packageGraph, options);
    onProgress({type: 'end', stage: 'tree'});
  }

  if (output.includes('treemap')) {
    onProgress({type: 'start', stage: 'treemap'});
    svgs.treemap = await buildTreemap(packageGraph, options);
    onProgress({type: 'end', stage: 'treemap'});
  }

  // Generate CSV
  let csvData;
  let jsonData;
  if (output.includes('csv')) {
    onProgress({type: 'start', stage: 'csv'});
    try {
      ({csvData, jsonData} = csv(dGraph.all));
    } catch (error) {
      errors.push(error);
    }
    onProgress({type: 'end', stage: 'csv'});
  }

  const allIssues = allIssuesFromReport({
    dependencyVulnerabilities,
    rootVulnerabilities,
    licenseIssues,
    metaIssues,
  });
  let resolvedIssues = loadResolvedIssues(appPath);
  let resolvedIssuesAlerts;

  try {
    // Doctor the resolved issues file
    resolvedIssuesAlerts = validateResolvedIssues(resolvedIssues, allIssues);
  } catch (error) {
    resolvedIssues = [];
    errors.push(error);
  }

  const allIssueCount = allIssues.length;
  const unresolvedIssues = {
    dependencyVulnerabilities: excludeResolved(dependencyVulnerabilities, resolvedIssues),
    rootVulnerabilities: excludeResolved(rootVulnerabilities, resolvedIssues),
    licenseIssues: excludeResolved(licenseIssues, resolvedIssues),
    metaIssues: excludeResolved(metaIssues, resolvedIssues),
  };
  const allUnresolvedIssues = allIssuesFromReport(unresolvedIssues);
  const unresolvedIssuesCount = allUnresolvedIssues.length;
  const resolvedIssuesCount = allIssueCount - unresolvedIssuesCount;

  return {
    ...unresolvedIssues,
    dependencyGraph: dGraph,
    licenseUsage,
    resolvedIssues,
    resolvedIssuesAlerts,
    resolvedIssuesCount,
    svgs,
    csv: csvData,
    allDependencies: jsonData,
    name: packageGraph.name,
    version: packageGraph.version,
    errors,
  };
};

module.exports = {
  getReport,
  getDependencyGraph,
  addDependencyGraphData,
};
