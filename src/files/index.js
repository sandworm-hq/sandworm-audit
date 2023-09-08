const path = require('path');
const fs = require('fs');
const lockfiles = require('./lockfiles');
const packages = require('./packages');
const {loadJsonFile} = require('./utils');
const {loadNpmConfigs} = require('./npmrc');

const RESOLVED_ISSUES_FILENAME = 'resolved-issues.json';

const outputFilenames = (name, version) => {
  const prefix = name && `${name.replace('/', '-')}${version ? `@${version}` : ''}`;

  return {
    tree: `${prefix ? `${prefix}-` : ''}tree.svg`,
    treemap: `${prefix ? `${prefix}-` : ''}treemap.svg`,
    dependenciesCsv: `${prefix ? `${prefix}-` : ''}dependencies.csv`,
    json: `${prefix ? `${prefix}-` : ''}report.json`,
  };
};

const loadManifest = (appPath) => {
  const javascriptManifestPath = path.join(appPath, 'package.json');
  const phpManifestPath = path.join(appPath, 'composer.json');

  if (fs.existsSync(javascriptManifestPath)) {
    const manifest = loadJsonFile(javascriptManifestPath);
    return {
      ...manifest,
      language: 'javascript',
    };
  }
  if (fs.existsSync(phpManifestPath)) {
    const manifest = loadJsonFile(phpManifestPath);
    return {
      ...manifest,
      language: 'php',
    };
  }

  return null;
};

module.exports = {
  RESOLVED_ISSUES_FILENAME,
  ...lockfiles,
  ...packages,
  loadManifest,
  loadNpmConfigs,
  loadResolvedIssues: (appPath) => loadJsonFile(path.join(appPath, RESOLVED_ISSUES_FILENAME)) || [],
  saveResolvedIssues: (appPath, content) =>
    fs.promises.writeFile(
      path.join(appPath, RESOLVED_ISSUES_FILENAME),
      JSON.stringify(content, null, 2),
    ),
  outputFilenames,
};
