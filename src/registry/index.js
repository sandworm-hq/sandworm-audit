const {getComposerRegistryData, getComposerRegistryAudit} = require('./composer');
const {getNpmRegistryData, setupNpmRegistries, getNpmRegistryAudit} = require('./npm');

const getRegistryData = async (packageManager, packageName, packageVersion) => {
  if (
    typeof packageManager !== 'string' ||
    typeof packageName !== 'string' ||
    !['string', 'undefined'].includes(typeof packageVersion)
  ) {
    throw new Error(
      `getRegistryData: invalid arguments given (${packageName} / ${packageVersion})`,
    );
  }

  if (
    packageManager === 'npm' ||
    packageManager === 'yarn' ||
    packageManager === 'yarn-classic' ||
    packageManager === 'pnpm'
  ) {
    return getNpmRegistryData(packageName, packageVersion);
  }

  if (packageManager === 'composer') {
    return getComposerRegistryData(packageName, packageVersion);
  }

  throw new Error(`getRegistryData: unsupported package manager ${packageManager}`);
};

const getRegistryDataMultiple = async (packageManager, packages, onProgress = () => {}) => {
  const totalCount = packages.length;
  let currentCount = 0;
  const errors = [];
  const data = [];
  const threadCount = 10;
  const packageQueue = [...packages];

  await Promise.all(
    [...Array(threadCount).keys()].map(async () => {
      let currentPackage;
      // eslint-disable-next-line no-cond-assign
      while ((currentPackage = packageQueue.pop())) {
        try {
          const {name, version} = currentPackage;
          // eslint-disable-next-line no-await-in-loop
          const packageData = await getRegistryData(packageManager, name, version);

          currentCount += 1;
          onProgress?.(`${currentCount}/${totalCount}`);
          data.push(packageData);
        } catch (error) {
          errors.push(error);
        }
      }

      return data;
    }),
  );

  return {
    data,
    errors,
  };
};

const setupRegistries = (appPath) => {
  setupNpmRegistries(appPath);
};

const getRegistryAudit = async ({
  packageManager,
  packageName,
  packageVersion,
  packageGraph,
  includeDev,
}) => {
  if (
    packageManager === 'npm' ||
    packageManager === 'yarn' ||
    packageManager === 'yarn-classic' ||
    packageManager === 'pnpm'
  ) {
    return getNpmRegistryAudit({packageName, packageVersion, packageGraph, includeDev});
  }

  if (packageManager === 'composer') {
    return getComposerRegistryAudit({packageName, packageVersion, packageGraph, includeDev});
  }

  return [];
};

module.exports = {
  setupRegistries,
  getRegistryData,
  getRegistryDataMultiple,
  getRegistryAudit,
};
