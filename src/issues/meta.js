const {getFindings} = require('./utils');

const INSTALL_SCRIPT_NAME = [
  'preinstall',
  'install',
  'postinstall',
];

module.exports = {
  getMetaIssues: ({dependencies = [], packageGraph}) => {
    const issues = [];

    dependencies.forEach((dep) => {
      if (dep.deprecated) {
        issues.push({
          severity: 'high',
          title: `Deprecated package: ${dep.name}`,
          name: dep.name,
          version: dep.version,
        });
      }

      const hasInstallScripts = INSTALL_SCRIPT_NAME.reduce(
        (agg, scriptName) => agg || Object.keys(dep.scripts || {}).includes(scriptName),
        false,
      );

      if (hasInstallScripts) {
        issues.push({
          severity: 'high',
          title: `Package uses install scripts: ${dep.name}`,
          name: dep.name,
          version: dep.version,
        });
      }

      if (!dep.repository || Object.keys(dep.repository).length === 0) {
        issues.push({
          severity: 'moderate',
          title: `Package has no specified repository: ${dep.name}`,
          name: dep.name,
          version: dep.version,
        });
      }

      Object.entries(dep.originalDependencies || {}).forEach(([depname, depstring]) => {
        if (depstring.startsWith('http')) {
          issues.push({
            severity: 'critical',
            title: `Package has HTTP dependency on "${depname}": ${dep.name}`,
            name: dep.name,
            version: dep.version,
          });
        } else if (depstring.startsWith('git')) {
          issues.push({
            severity: 'critical',
            title: `Package has GIT dependency on "${depname}": ${dep.name}`,
            name: dep.name,
            version: dep.version,
          });
        } else if (depstring.startsWith('file')) {
          issues.push({
            severity: 'moderate',
            title: `Package has file dependency on "${depname}": ${dep.name}`,
            name: dep.name,
            version: dep.version,
          });
        }
      });
    });

    return issues.map((issue) => ({
      ...issue,
      findings: getFindings({
        packageGraph,
        packageName: issue.name,
        range: issue.version,
      }),
      type: 'meta',
    }));
  },
};
