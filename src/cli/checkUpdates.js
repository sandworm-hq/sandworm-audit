const path = require('path');
const semver = require('semver');
const {loadManifest} = require('../files');
const {getRegistryData} = require('../graph/utils');
const logger = require('./logger');

module.exports = async () => {
  const {version: currentVersion} = await loadManifest(path.join(__dirname, '../..'));
  const data = await getRegistryData('@sandworm/audit');
  const latestVersion = data['dist-tags']?.latest;

  if (semver.lt(currentVersion, latestVersion)) {
    logger.log(
      `🔔 ${logger.colors.BG_CYAN}${logger.colors.BLACK}%s${logger.colors.RESET}\n`,
      'New version available! Run "npm i -g @sandworm/audit" to update.',
    );
  }
};
