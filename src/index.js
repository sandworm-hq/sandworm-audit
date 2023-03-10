const {getDependencyVulnerabilities} = require('./issues/vulnerabilities');
const {getLicenseIssues, getLicenseUsage} = require('./issues/license');
const {buildTree, buildTreemap} = require('./charts');
const {getReports} = require('./issues/utils');
const csv = require('./charts/csv');
const {getMetaIssues} = require('./issues/meta');
const validateConfig = require('./validateConfig');
const getDependencyGraph = require('./graph');
const {addDependencyGraphData} = require('./graph/utils');

const getReport = async ({
  appPath,
  dependencyGraph,
  includeDev = false,
  showVersions = false,
  rootIsShell = false,
  getAdvisoriesForRoot = true,
  minDisplayedSeverity = 'high',
  width = 1500,
  maxDepth = 7,
  licensePolicy,
  loadDataFrom = 'registry',
  onProgress = () => {},
} = {}) => {
  validateConfig({
    appPath,
    dependencyGraph,
    minDisplayedSeverity,
    width,
    maxDepth,
    loadDataFrom,
    licensePolicy,
    onProgress,
  });

  let errors = [];

  // Generate the dependency graph
  onProgress({type: 'start', stage: 'graph'});
  const dGraph =
    dependencyGraph || (await getDependencyGraph(appPath, {loadDataFrom, rootIsShell, includeDev}));
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

  if (getAdvisoriesForRoot) {
    try {
      rootVulnerabilities = await getReports(packageGraph.name, packageGraph.version, packageGraph);
    } catch (error) {
      errors.push(error);
    }
  }
  onProgress({type: 'end', stage: 'vulnerabilities'});

  // Get license info and issues
  onProgress({type: 'start', stage: 'licenses'});
  try {
    licenseUsage = await getLicenseUsage({
      dependencies: includeDev ? dGraph.all : dGraph.prodDependencies,
    });
    licenseIssues = await getLicenseIssues({licenseUsage, packageGraph, licensePolicy});
  } catch (error) {
    errors.push(error);
  }
  onProgress({type: 'end', stage: 'licenses'});

  // Get meta issues
  onProgress({type: 'start', stage: 'issues'});
  try {
    metaIssues = await getMetaIssues({
      dependencies: includeDev ? dGraph.all : dGraph.prodDependencies,
      packageGraph,
    });
  } catch (error) {
    errors.push(error);
  }
  onProgress({type: 'end', stage: 'issues'});

  // Generate charts
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
    onProgress: (message) => onProgress({type: 'update', stage: 'chart', message}),
  };

  const methods = {
    tree: buildTree,
    treemap: buildTreemap,
  };

  const svgs = await ['tree', 'treemap'].reduce(async (agg, type) => {
    const current = await agg;
    const method = methods[type];

    onProgress({type: 'start', stage: type});
    const chart = await method.call(method, packageGraph, options);
    onProgress({type: 'end', stage: type});

    current[type] = chart;

    return current;
  }, Promise.resolve({}));

  // Generate CSV
  onProgress({type: 'start', stage: 'csv'});
  let csvData;
  let jsonData;
  try {
    ({csvData, jsonData} = csv(dGraph.all));
  } catch (error) {
    errors.push(error);
  }
  onProgress({type: 'end', stage: 'csv'});

  return {
    dependencyGraph: dGraph,
    dependencyVulnerabilities,
    rootVulnerabilities,
    licenseUsage,
    licenseIssues,
    metaIssues,
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
