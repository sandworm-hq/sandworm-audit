const {exec} = require('child_process');
const {join} = require('path');

const logger = console;
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

const decorateWithSize = async ({modules = {}, path = [], onProgress = () => {}, appPath}) =>
  Object.values(modules).reduce(async (acc, module) => {
    await acc;
    onProgress(module);
    const pathToPackage = join(appPath, 'node_modules', module.name);
    let size = 0;
    try {
      size = await getFolderSize(pathToPackage);
    } catch (error) {
      logger.error(`\nCould not get size for directory: ${pathToPackage}`);
    }
    const ancestors = module.ancestors || [];
    const currentPath = [...path, `${module.name}@${module.version}`];
    ancestors.push(currentPath);
    Object.assign(module, {
      size,
      ancestors,
    });

    return decorateWithSize({modules: module.dependencies, path: currentPath, onProgress, appPath});
  }, Promise.resolve());

module.exports = {
  decorateWithSize,
};
