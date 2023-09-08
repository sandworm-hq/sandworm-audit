const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');
const {normalizeComposerManifest} = require('../registry/utils');

const packageSizeCache = {};

const getFolderSize = (folderPath) =>
  new Promise((resolve, reject) => {
    const cachedSize = packageSizeCache[folderPath];
    if (cachedSize) {
      resolve(cachedSize);
    } else {
      exec(
        process.platform === 'darwin' ? 'du -sk .' : 'du -sb .',
        {cwd: folderPath},
        (err, stdout) => {
          if (err) {
            reject(err);
          } else {
            const match = /^(\d+)/.exec(stdout);
            const size = Number(match[1]) * (process.platform === 'darwin' ? 1024 : 1);
            packageSizeCache[folderPath] = size;
            resolve(size);
          }
        },
      );
    }
  });

const getPackageSize = async (packagePath) => {
  try {
    let totalSize = await getFolderSize(packagePath);
    const modulesPath = path.join(packagePath, 'node_modules');
    if (fs.existsSync(modulesPath)) {
      totalSize -= await getFolderSize(modulesPath);
    }
    return totalSize;
  } catch (error) {
    return undefined;
  }
};

const loadInstalledPackages = async (rootPath, subPath = '') => {
  const currentPath = path.join(rootPath, subPath);
  const currentDirname = currentPath.split(path.sep).pop();
  const manifestFilenames = {
    npm: 'package.json',
    composer: 'composer.json',
  };

  let packagesAtRoot = (
    await Promise.all(
      Object.entries(manifestFilenames).map(async ([manager, manifestFilename]) => {
        try {
          const manifestContent = await fs.promises.readFile(
            path.join(currentPath, manifestFilename),
            {
              encoding: 'utf-8',
            },
          );
          const packageAtRootData = JSON.parse(manifestContent);
          packageAtRootData.relativePath = subPath;
          packageAtRootData.packageType = manager;
          packageAtRootData.size = await getPackageSize(currentPath);

          return packageAtRootData;
          // eslint-disable-next-line no-empty
        } catch (error) {
          return null;
        }
      }),
    )
  ).filter((m) => m && m.name && m.version);

  if (currentDirname === 'composer' && fs.existsSync(path.join(currentPath, 'installed.json'))) {
    try {
      const composerInstalledData = await fs.promises.readFile(
        path.join(currentPath, 'installed.json'),
        {
          encoding: 'utf-8',
        },
      );
      const composerInstalled = JSON.parse(composerInstalledData);
      packagesAtRoot = await Promise.all(
        (composerInstalled.packages || []).map(async (p) => ({
          ...normalizeComposerManifest(p),
          relativePath: path.join(subPath, p['install-path']),
          packageType: 'composer',
          size: await getPackageSize(path.join(currentPath, p['install-path'])),
        })),
      );
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  const subdirectories = (await fs.promises.readdir(currentPath, {withFileTypes: true}))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const allChildren = await subdirectories.reduce(async (previous, subdir) => {
    const children = await previous;
    const subDirChildren = await loadInstalledPackages(rootPath, path.join(subPath, subdir));

    return [...children, ...subDirChildren];
  }, Promise.resolve([]));

  return [...packagesAtRoot, ...allChildren];
};

module.exports = {loadInstalledPackages, getPackageSize};
