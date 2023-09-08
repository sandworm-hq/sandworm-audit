const semver = require('semver');
const fetch = require('../fetch');
const {reportFromComposerAdvisory} = require('../issues/utils');
const {normalizeComposerManifest} = require('./utils');

const DEFAULT_REGISTRY_URL = 'https://repo.packagist.org/';

const getComposerRegistryData = async (packageName, packageVersion) => {
  const packageUrl = new URL(`/p2/${packageName}.json`, DEFAULT_REGISTRY_URL);

  const responseRaw = await fetch(packageUrl.href);
  const response = await responseRaw.json();

  const allVersions = response.packages[packageName];
  const fullData = allVersions[0];
  const requestedVersion = packageVersion || fullData.version;
  const versionData = allVersions.find(({version}) => version === requestedVersion);
  const joinedData = {
    ...fullData,
    ...versionData,
  };

  return normalizeComposerManifest(joinedData, fullData.version);
};

const getComposerRegistryAudit = async ({
  packageName,
  packageVersion,
  packageGraph,
  includeDev,
}) => {
  const responseRaw = await fetch(
    `https://packagist.org/api/security-advisories/?packages=${packageName}`,
  );
  const response = await responseRaw.json();
  const rawAdvisories = Array.isArray(response.advisories)
    ? response.advisories
    : response.advisories[packageName] || [];

  return rawAdvisories
    .filter(({affectedVersions}) =>
      semver.satisfies(
        packageVersion,
        affectedVersions.replaceAll(',', ' ').replaceAll('|', ' || '),
      ),
    )
    .reduce(async (aggPromise, advisory) => {
      const agg = await aggPromise;
      return [...agg, await reportFromComposerAdvisory(advisory, packageGraph, includeDev)];
    }, Promise.resolve([]));
};

module.exports = {
  getComposerRegistryData,
  getComposerRegistryAudit,
};
