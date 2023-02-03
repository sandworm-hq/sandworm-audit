const {getDependencyGraph, addDependencyGraphData} = require('sandworm-utils');
const {getDependencyVulnerabilities} = require('./issues/vulnerabilities');
const { getLicenseIssues, getLicenseUsage } = require('./issues/license');
const {buildTree, buildTreemap} = require('./charts');
const {getReports} = require('./issues/utils');
const csv = require('./charts/csv');

const getReport = async ({
  types = ['tree', 'treemap'],
  appPath,
  includeDev = false,
  showVersions = false,
  width = 1500,
  maxDepth = 7,
  showLicenseInfo = true,
  onProgress = () => {},
  dependencyGraph,
}) => {
  const errors = [];
  onProgress({type: 'start', stage: 'graph'});
  const dGraph = dependencyGraph || (await getDependencyGraph(appPath, {loadDataFromDisk: true}));
  const packageGraph = dGraph.root;
  onProgress({type: 'end', stage: 'graph'});

  onProgress({type: 'start', stage: 'vulnerabilities'});
  let dependencyVulnerabilities;
  let rootVulnerabilities;
  let licenseUsage;
  let licenseIssues;

  try {
    dependencyVulnerabilities = await getDependencyVulnerabilities({
      appPath,
      packageManager: packageGraph.meta.packageManager,
      packageGraph,
      onProgress: (message) => onProgress({type: 'update', stage: 'vulnerabilities', message}),
    });
  } catch (error) {
    errors.push(error);
  }

  try {
    rootVulnerabilities = await getReports(packageGraph.name, packageGraph.version, packageGraph)
  } catch (error) {
    errors.push(error);
  }

  try {
    licenseUsage = await getLicenseUsage({dependencies: dGraph.prodDependencies});
    licenseIssues = await getLicenseIssues({licenseUsage, packageGraph});
  } catch (error) {
    errors.push(error);
  }

  onProgress({type: 'end', stage: 'vulnerabilities'});

  const options = {
    showVersions,
    width,
    maxDepth,
    vulnerabilities: dependencyVulnerabilities,
    includeDev,
    showLicenseInfo,
    onProgress: (message) => onProgress({type: 'update', stage: 'chart', message}),
  };

  const methods = {
    tree: buildTree,
    treemap: buildTreemap,
  };

  const svgs = await types.reduce(async (agg, type) => {
    const current = await agg;
    const method = methods[type];

    onProgress({type: 'start', stage: type});
    const chart = await method.call(method, packageGraph, options);
    onProgress({type: 'end', stage: type});

    current[type] = chart;

    return current;
  }, Promise.resolve({}));

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
    dependencyVulnerabilities: dependencyVulnerabilities.filter(({findings: {affects}}) => affects.length),
    rootVulnerabilities,
    licenseUsage,
    licenseIssues,
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
