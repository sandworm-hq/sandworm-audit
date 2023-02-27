const {loadLockfile, loadManifest, loadInstalledPackages} = require('../files');
const generateNpmGraph = require('./generateNpmGraph');
const generatePnpmGraph = require('./generatePnpmGraph');
const generateYarnGraph = require('./generateYarnGraph');
const {postProcessGraph, addDependencyGraphData, getRegistryDataMultiple} = require('./utils');

const generateGraphPromise = async (appPath, {packageData, loadDataFrom = false} = {}) => {
  const lockfile = await loadLockfile(appPath);
  const manifest = loadManifest(appPath);
  let graph;
  let errors = [];

  if (lockfile.manager === 'npm') {
    graph = await generateNpmGraph(lockfile.data);
  } else if (lockfile.manager === 'yarn-classic') {
    graph = await generateYarnGraph({
      data: lockfile.data,
      manifest,
    });
  } else if (lockfile.manager === 'yarn') {
    graph = await generateYarnGraph({
      data: lockfile.data,
      manifest,
    });
  } else if (lockfile.manager === 'pnpm') {
    graph = await generatePnpmGraph({
      data: lockfile.data?.packages || {},
      manifest,
    });
  }

  const {root, allPackages} = graph;
  const processedRoot = postProcessGraph({root});
  const allConnectedPackages = allPackages.filter(
    ({name, version, parents}) =>
      (name === manifest.name && version === manifest.version) ||
      Object.values(parents).reduce((agg, deps) => agg + Object.keys(deps).length, 0),
  );
  const devDependencies = allConnectedPackages.filter(({flags}) => flags.dev);
  const prodDependencies = allConnectedPackages.filter(({flags}) => flags.prod);

  let additionalPackageData = packageData;

  if (!packageData && loadDataFrom) {
    if (loadDataFrom === 'disk') {
      additionalPackageData = await loadInstalledPackages(appPath);
    } else if (loadDataFrom === 'registry') {
      const {data, errors: registryErrors} = await getRegistryDataMultiple(prodDependencies);
      additionalPackageData = data;
      errors = [...errors, ...registryErrors];
    }
  }

  if (additionalPackageData) {
    addDependencyGraphData({root, packageData: additionalPackageData});
  }

  return {
    root: {
      ...(processedRoot || {}),
      meta: {lockfileVersion: lockfile.lockfileVersion, packageManager: lockfile.manager},
    },
    all: allConnectedPackages,
    devDependencies,
    prodDependencies,
    errors,
  };
};

const generateGraphAsync = (appPath, options, done = () => {}) => {
  (async () => {
    const graph = await generateGraphPromise(appPath, options);
    done(graph);
  })();
};

const generateGraph = (appPath, {packageData, loadDataFrom = false} = {}, done = undefined) => {
  if (typeof done === 'function') {
    return generateGraphAsync(appPath, {packageData, loadDataFrom}, done);
  }

  return generateGraphPromise(appPath, {packageData, loadDataFrom});
};

module.exports = generateGraph;
