const path = require('path');
const lockfiles = require('./lockfiles');
const packages = require('./packages');
const {loadJsonFile} = require('./utils');

module.exports = {
  ...lockfiles,
  ...packages,
  loadManifest: (appPath) => loadJsonFile(path.join(appPath, 'package.json')),
};
