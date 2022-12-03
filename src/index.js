const {graph} = require('sandworm-utils');
const {getVulnerabilities} = require('./vulnerabilities');
const {buildTree, buildTreemap} = require('./charts');
const {getPackageSizes} = require('./package');

const getChartsSVG = async ({
  types = ['tree', 'treemap'],
  appPath,
  includeDev = false,
  showVersions = false,
  width = 1500,
  maxDepth = 7,
  onProgress = () => {},
}) => {
  let packageTree;
  
  if (types.includes('treemap')) {
    onProgress({type: 'start', stage: 'sizes'});
    packageTree = await getPackageSizes({
      appPath,
      onProgress: ({name, version}) =>
        onProgress({type: 'update', stage: 'sizes', message: `${name}@${version}`}),
    });
    onProgress({type: 'end', stage: 'sizes'});
  } else {
    packageTree = (await graph(appPath)).root;
  }

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
    // Only npm produces license info for now
    showLicenseInfo: packageTree.meta.packageManager === 'npm',
    onProgress: (message) => onProgress({type: 'update', stage: 'chart', message}),
  };

  const methods = {
    tree: buildTree,
    treemap: buildTreemap,
  }

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
    svgs,
    name: packageTree.name,
    version: packageTree.version,
  }
};

module.exports = {
  getChartsSVG,
};
