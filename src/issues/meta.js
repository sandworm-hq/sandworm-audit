const {getFindings, makeSandwormIssueId, isWorkspaceProject} = require('./utils');

const INSTALL_SCRIPT_NAME = ['preinstall', 'install', 'postinstall'];

module.exports = {
  getMetaIssues: ({dependencies = [], packageGraph, workspace}) => {
    const issues = [];

    dependencies.forEach((dep) => {
      if (dep.deprecated) {
        issues.push({
          severity: 'high',
          title: 'Deprecated package',
          name: dep.name,
          version: dep.version,
          sandwormIssueCode: 200,
        });
      }

      const installScripts = INSTALL_SCRIPT_NAME.reduce(
        (agg, scriptName) => ({
          ...agg,
          ...(dep.scripts?.[scriptName] && {[scriptName]: dep.scripts?.[scriptName]}),
        }),
        {},
      );

      Object.entries(installScripts).forEach(([scriptName, scriptString]) => {
        if (scriptString !== 'node-gyp rebuild') {
          issues.push({
            severity: 'high',
            title: `Package uses ${scriptName} script: "${scriptString}"`,
            shortTitle: `Uses ${scriptName} script`,
            name: dep.name,
            version: dep.version,
            sandwormIssueCode: 201,
            sandwormIssueSpecifier: scriptName,
          });
        }
      });

      if (
        (!dep.repository || Object.keys(dep.repository).length === 0) &&
        !isWorkspaceProject(workspace, dep)
      ) {
        issues.push({
          severity: 'moderate',
          title: 'Package has no specified source code repository',
          shortTitle: 'Has no repository',
          name: dep.name,
          version: dep.version,
          sandwormIssueCode: 202,
        });
      }

      Object.entries(dep.originalDependencies || {}).forEach(([depname, depstring]) => {
        if (depstring.startsWith('http')) {
          issues.push({
            severity: 'critical',
            title: `Package has HTTP dependency for "${depname}"`,
            shortTitle: 'Has HTTP dependency',
            name: dep.name,
            version: dep.version,
            sandwormIssueCode: 203,
            sandwormIssueSpecifier: depname,
          });
        } else if (depstring.startsWith('git')) {
          issues.push({
            severity: 'critical',
            title: `Package has GIT dependency for "${depname}"`,
            shortTitle: 'Has GIT dependency',
            name: dep.name,
            version: dep.version,
            sandwormIssueCode: 204,
            sandwormIssueSpecifier: depname,
          });
        } else if (depstring.startsWith('file')) {
          issues.push({
            severity: 'moderate',
            title: `Package has file dependency for "${depname}"`,
            shortTitle: 'Has file dependency',
            name: dep.name,
            version: dep.version,
            sandwormIssueCode: 205,
            sandwormIssueSpecifier: depname,
          });
        }
      });
    });

    return issues.map((issue) => ({
      ...issue,
      sandwormIssueId: makeSandwormIssueId({
        code: issue.sandwormIssueCode,
        name: issue.name,
        version: issue.version,
        specifier: issue.sandwormIssueSpecifier,
      }),
      findings: getFindings({
        packageGraph,
        packageName: issue.name,
        range: issue.version,
      }),
      type: 'meta',
    }));
  },
};
