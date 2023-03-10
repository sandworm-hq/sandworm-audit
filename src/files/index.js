const path = require('path');
const fs = require('fs');
const lockfiles = require('./lockfiles');
const packages = require('./packages');
const {loadJsonFile} = require('./utils');

const RESOLVED_ISSUES_FILENAME = 'resolved-issues.json';

const outputFilenames = (name, version) => {
  const prefix = `${name.replace('/', '-')}@${version}`;

  return {
    tree: `${prefix}-tree.svg`,
    treemap: `${prefix}-treemap.svg`,
    dependenciesCsv: `${prefix}-dependencies.csv`,
    json: `${prefix}-report.json`,
  };
};

module.exports = {
  RESOLVED_ISSUES_FILENAME,
  ...lockfiles,
  ...packages,
  loadManifest: (appPath) => loadJsonFile(path.join(appPath, 'package.json')),
  loadResolvedIssues: (appPath) => loadJsonFile(path.join(appPath, RESOLVED_ISSUES_FILENAME)) || [],
  saveResolvedIssues: (appPath, content) =>
    fs.promises.writeFile(
      path.join(appPath, RESOLVED_ISSUES_FILENAME),
      JSON.stringify(content, null, 2),
    ),
  outputFilenames,
};
