const {
  files: {loadDependencies},
} = require('sandworm-utils');
const {getVulnerabilities} = require('./vulnerabilities');
const {buildTree, buildTreemap} = require('./charts');
const {getPackageSizes} = require('./package');

const getVulnerabilitiesAndTrackProgress = async ({appPath, packageManager, onProgress}) => {
  onProgress({type: 'start', stage: 'vulnerabilities'});
  const vulnerabilities = await getVulnerabilities({
    appPath,
    packageManager,
    onProgress: (message) => onProgress({type: 'update', stage: 'vulnerabilities', message}),
  });
  onProgress({type: 'end', stage: 'vulnerabilities'});

  return vulnerabilities;
};

const getTreeSVG = async ({
  appPath,
  includeDev = false,
  showVersions = false,
  width = 1500,
  maxDepth = 7,
  onProgress = () => {},
}) => {
  const {packageTree} = await loadDependencies(appPath, includeDev);

  const vulnerabilities = await getVulnerabilitiesAndTrackProgress({
    appPath,
    packageManager: packageTree.meta.packageManager,
    onProgress,
  });

  onProgress({type: 'start', stage: 'chart'});
  const tree = buildTree(packageTree, {
    showVersions,
    width,
    vulnerabilities,
    maxDepth,
  });
  onProgress({type: 'end', stage: 'chart'});

  return tree;
};

const getTreemapSVG = async ({
  appPath,
  includeDev = false,
  width = 1500,
  maxDepth = Infinity,
  onProgress = () => {},
}) => {
  onProgress({type: 'start', stage: 'sizes'});
  const packageTree = await getPackageSizes({
    appPath,
    includeDev,
    onProgress: ({name, version}) =>
      onProgress({type: 'update', stage: 'sizes', message: `${name}@${version}`}),
  });
  onProgress({type: 'end', stage: 'sizes'});

  const vulnerabilities = await getVulnerabilitiesAndTrackProgress({
    appPath,
    packageManager: packageTree.meta.packageManager,
    onProgress,
  });

  onProgress({type: 'start', stage: 'chart'});
  const treemap = buildTreemap(packageTree, {
    width,
    vulnerabilities,
    maxDepth,
    onProgress: (message) => onProgress({type: 'update', stage: 'chart', message}),
  });
  onProgress({type: 'end', stage: 'chart'});

  return treemap;
};

module.exports = {
  getTreeSVG,
  getTreemapSVG,
};
