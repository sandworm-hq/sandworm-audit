const licenseGroups = require('./licenses.json');
const {getFindings} = require('./utils');

const LICENSE_TYPES = [
  'Public Domain',
  'Permissive',
  'Weakly Protective',
  'Strongly Protective',
  'Network Protective',
  'Uncategorized',
  'Invalid',
];

const DEFAULT_POLICY = {
  high: ['cat:Network Protective', 'cat:Strongly Protective'],
  moderate: ['cat:Weakly Protective'],
};

const typeForLicense = (license) => {
  if (!license || license === 'N/A') {
    return 'N/A';
  }
  if (license.includes(' ')) {
    // Parse simple AND/OR SPDX expressions
    if ((license.match(/\s/g) || []).length === 2) {
      let expressionLicenses;
      let condition;

      if (license.match(/ or /i)) {
        condition = 'or';
        expressionLicenses = license.replace(/[()]/g, '').split(/ or /i);
      } else if (license.match(/ and /i)) {
        condition = 'and';
        expressionLicenses = license.replace(/[()]/g, '').split(/ and /i);
      }

      if (expressionLicenses) {
        const expressionTypes = [
          typeForLicense(expressionLicenses[0]),
          typeForLicense(expressionLicenses[1]),
        ];

        if ([expressionTypes[0], expressionTypes[1]].includes('Invalid')) {
          return 'Invalid';
        }

        const aggregateExpressionType =
          LICENSE_TYPES[
            condition === 'or'
              ? Math.min(
                  LICENSE_TYPES.indexOf(expressionTypes[0]),
                  LICENSE_TYPES.indexOf(expressionTypes[1]),
                )
              : Math.max(
                  LICENSE_TYPES.indexOf(expressionTypes[0]),
                  LICENSE_TYPES.indexOf(expressionTypes[1]),
                )
          ];

        return aggregateExpressionType;
      }
    }
    return 'Expression';
  }
  return licenseGroups.types.find(({licenses}) => licenses.includes(license))?.type || 'Invalid';
};

module.exports = {
  typeForLicense,
  getLicenseUsage: ({dependencies = []}) => {
    const licenseUsage = dependencies.reduce((agg, {name, version, license}) => {
      const licenseName = license || 'N/A';

      return {
        ...agg,
        [licenseName]: {
          meta: {
            type: typeForLicense(licenseName),
          },
          dependencies: (agg[licenseName]?.dependencies || []).concat([{name, version}]),
        },
      };
    }, {});

    return licenseUsage;
  },

  getLicenseIssues: ({licenseUsage, packageGraph}) => {
    const issues = [];

    Object.entries(licenseUsage).forEach(([licenseName, {meta, dependencies}]) => {
      const licenseType = meta?.type;
      if (licenseName === 'N/A') {
        issues.push({
          severity: 'critical',
          title: 'Dependency has no specified license',
          shortTitle: 'No license specified',
          dependencies,
        });
      } else if (licenseName === 'UNLICENSED') {
        issues.push({
          severity: 'critical',
          title: 'Dependency is explicitly not available for use under any terms',
          shortTitle: 'Not licensed for use',
          dependencies,
        });
      } else if (!licenseName.includes(' ')) {
        if (!licenseGroups.osiApproved.includes(licenseName)) {
          issues.push({
            severity: 'low',
            title: `Dependency uses a license that is not OSI approved: ${licenseName}`,
            shortTitle: 'License not OSI approved',
            dependencies,
          });
        }
        if (licenseGroups.deprecated.includes(licenseName)) {
          issues.push({
            severity: 'low',
            title: `Dependency uses a deprecated license: ${licenseName}`,
            shortTitle: 'License is deprecated',
            dependencies,
          });
        }
      }

      if (!licenseType || licenseType === 'Uncategorized') {
        issues.push({
          severity: 'high',
          title: `Dependency uses an atypical license: ${licenseName}`,
          shortTitle: 'Atypical license',
          dependencies,
        });
      } else if (licenseType === 'Invalid') {
        issues.push({
          severity: 'high',
          title: `Dependency uses an invalid SPDX license: ${licenseName}`,
          shortTitle: 'Invalid SPDX license',
          dependencies,
        });
      } else if (licenseType === 'Expression') {
        issues.push({
          severity: 'high',
          title: `Dependency uses a custom license expression: ${licenseName}`,
          shortTitle: 'Custom license expression',
          dependencies,
        });
      }

      Object.entries(DEFAULT_POLICY).forEach(([severity, includes]) => {
        if (includes.includes(licenseName)) {
          issues.push({
            severity,
            title: `Dependency uses a problematic license: ${licenseName}`,
            shortTitle: 'Problematic license',
            dependencies,
          });
        } else if (includes.includes(`cat:${licenseType}`)) {
          issues.push({
            severity,
            title: `Dependency uses a problematic ${licenseType} license: ${licenseName}`,
            shortTitle: 'Problematic license',
            dependencies,
          });
        }
      });
    });

    return issues.reduce(
      (agg, {severity, title, shortTitle, dependencies}) =>
        agg.concat(
          dependencies.map(({name, version}) => ({
            severity,
            title,
            shortTitle,
            name,
            version,
            findings: getFindings({
              packageGraph,
              packageName: name,
              range: version,
              allPathsAffected: false,
            }),
          })),
        ),
      [],
    );
  },
};
