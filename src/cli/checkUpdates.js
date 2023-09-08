const path = require('path');
const semver = require('semver');
const {loadManifest} = require('../files');
const {getRegistryData} = require('../registry');

module.exports = async () => {
  try {
    const {version: currentVersion} = await loadManifest(path.join(__dirname, '../..'));
    const data = await getRegistryData('npm', '@sandworm/audit');
    const latestVersion = data['dist-tags']?.latest;

    return semver.lt(currentVersion, latestVersion);
  } catch (error) {
    return false;
  }
};
