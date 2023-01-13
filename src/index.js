const {getDependencyGraph, addDependencyGraphData} = require('sandworm-utils');
const {getVulnerabilities} = require('./vulnerabilities');
const {buildTree, buildTreemap} = require('./charts');

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
  onProgress({type: 'start', stage: 'graph'});
  const packageTree = (
    dependencyGraph || (await getDependencyGraph(appPath, {loadDataFromDisk: true}))
  ).root;
  onProgress({type: 'end', stage: 'graph'});

  onProgress({type: 'start', stage: 'vulnerabilities'});
  const vulnerabilities = await getVulnerabilities({
    appPath,
    packageManager: packageTree.meta.packageManager,
    onProgress: (message) => onProgress({type: 'update', stage: 'vulnerabilities', message}),
  });
  onProgress({type: 'end', stage: 'vulnerabilities'});

  const options = {
    showVersions,
    width,
    maxDepth,
    vulnerabilities,
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
    const chart = await method.call(method, packageTree, options);
    onProgress({type: 'end', stage: type});

    current[type] = chart;

    return current;
  }, Promise.resolve({}));

  return {
    vulnerabilities,
    svgs,
    name: packageTree.name,
    version: packageTree.version,
  };
};

module.exports = {
  getReport,
  getDependencyGraph,
  addDependencyGraphData,
};
