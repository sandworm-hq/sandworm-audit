const {UsageError} = require('../errors');
const {loadLockfile, loadManifest, loadInstalledPackages} = require('../files');
const {loadWorkspace} = require('../files/workspace');
const {postProcessGraph, addDependencyGraphData} = require('./utils');
const {getRegistryData} = require('../registry');
const generateNpmGraph = require('./generateNpmGraph');
const generatePnpmGraph = require('./generatePnpmGraph');
const generateYarnGraph = require('./generateYarnGraph');
const generateComposerGraph = require('./generateComposerGraph');

const generateGraphPromise = async (
  appPath,
  {
    packageData,
    loadDataFrom = false,
    rootIsShell = false,
    includeDev = false,
    packageType,
    onProgress,
  } = {},
) => {
  const workspace = await loadWorkspace(appPath);
  let lockfile = await loadLockfile(appPath, packageType);

  if (!lockfile && workspace) {
    lockfile = await loadLockfile(workspace.path, packageType);
  }

  if (!lockfile) {
    throw new UsageError('No lockfile found');
  }

  if (lockfile.error) {
    throw new Error(lockfile.error);
  }

  const manifest = loadManifest(appPath, lockfile.packageType);

  if (!manifest) {
    throw new UsageError('Manifest not found at app path');
  }

  let graph;
  let errors = [];

  if (lockfile.manager === 'npm') {
    graph = await generateNpmGraph({
      lockfileVersion: lockfile.lockfileVersion,
      data: lockfile.data,
      manifest,
      workspace,
    });
  } else if (lockfile.manager === 'yarn' || lockfile.manager === 'yarn-classic') {
    graph = await generateYarnGraph({
      data: lockfile.data,
      manifest,
      workspace,
    });
  } else if (lockfile.manager === 'pnpm') {
    graph = await generatePnpmGraph({
      data: lockfile.data?.packages || {},
      manifest,
      workspace,
    });
  } else if (lockfile.manager === 'composer') {
    graph = await generateComposerGraph({
      data: lockfile.data,
      manifest,
    });
  }

  const {root, allPackages} = graph;
  let processedRoot = postProcessGraph({root});
  let allConnectedPackages = allPackages.filter(
    ({name, version, parents}) =>
      (name === manifest.name && version === manifest.version) ||
      Object.values(parents).reduce((agg, deps) => agg + Object.keys(deps).length, 0),
  );

  if (rootIsShell) {
    const shellName = processedRoot.name;
    const shellVersion = processedRoot.version;
    [processedRoot] = Object.values(processedRoot.dependencies);
    allConnectedPackages = allConnectedPackages.filter(
      ({name, version}) => name !== shellName || version !== shellVersion,
    );
  }

  const devDependencies = allConnectedPackages.filter(({flags}) => flags.dev);
  const prodDependencies = allConnectedPackages.filter(({flags}) => flags.prod);

  let additionalPackageData = packageData || [];

  if (workspace) {
    additionalPackageData = additionalPackageData.concat(workspace.workspaceProjects);
  }

  if (loadDataFrom === 'disk') {
    const installedPackages = await loadInstalledPackages(workspace?.path || appPath);
    additionalPackageData = additionalPackageData.concat(
      installedPackages.filter(({packageType: pt}) => packageType === pt),
    );
  }

  let currentCount = 0;
  const totalCount = includeDev ? allConnectedPackages.length : prodDependencies.length;
  const registryErrors = await addDependencyGraphData({
    root: processedRoot,
    packageData: additionalPackageData,
    packageManager: lockfile.manager,
    loadDataFrom,
    includeDev,
    getRegistryData,
    onProgress: () =>
      onProgress?.(
        // eslint-disable-next-line no-plusplus
        `${currentCount++}/${totalCount}`,
      ),
  });

  errors = [...errors, ...registryErrors];

  return {
    root: Object.assign(processedRoot || {}, {
      meta: {
        lockfileVersion: lockfile.lockfileVersion,
        packageManager: lockfile.manager,
        packageManagerVersion: lockfile.managerVersion,
      },
    }),
    workspace,
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

const generateGraph = (
  appPath,
  {
    packageData,
    loadDataFrom = false,
    rootIsShell = false,
    includeDev = false,
    packageType,
    onProgress,
  } = {},
  done = undefined,
) => {
  if (typeof done === 'function') {
    return generateGraphAsync(
      appPath,
      {packageData, loadDataFrom, rootIsShell, includeDev, packageType, onProgress},
      done,
    );
  }

  return generateGraphPromise(appPath, {
    packageData,
    loadDataFrom,
    rootIsShell,
    includeDev,
    packageType,
    onProgress,
  });
};

module.exports = generateGraph;
