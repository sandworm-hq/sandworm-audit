const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');

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
  let packageAtRootData;
  const currentPath = path.join(rootPath, subPath);
  try {
    const manifestContent = await fs.promises.readFile(path.join(currentPath, 'package.json'), {
      encoding: 'utf-8',
    });
    packageAtRootData = JSON.parse(manifestContent);
    packageAtRootData.relativePath = subPath;
    // eslint-disable-next-line no-empty
  } catch (error) {}

  if (packageAtRootData) {
    packageAtRootData.size = await getPackageSize(currentPath);
  }

  const subdirectories = (await fs.promises.readdir(currentPath, {withFileTypes: true}))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const allChildren = await subdirectories.reduce(async (previous, subdir) => {
    const children = await previous;
    const subDirChildren = await loadInstalledPackages(rootPath, path.join(subPath, subdir));

    return [...children, ...subDirChildren];
  }, Promise.resolve([]));

  return packageAtRootData ? [packageAtRootData, ...allChildren] : allChildren;
};

module.exports = {loadInstalledPackages, getPackageSize};
