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
    const allLicenses = Object.keys(licenseUsage);

    if (allLicenses.includes('N/A')) {
      issues.push({
        severity: 'critical',
        title: 'Dependencies have no specified license',
        dependencies: licenseUsage['N/A'].dependencies,
      });
    }

    Object.entries(licenseUsage).forEach(([licenseName, {meta, dependencies}]) => {
      const licenseType = meta?.type;

      if (!licenseName.includes(' ') && !['Expression', 'N/A'].includes(licenseType)) {
        if (!licenseGroups.osiApproved.includes(licenseName)) {
          issues.push({
            severity: 'low',
            title: `Dependencies use a license that is not OSI approved: ${licenseName}`,
            dependencies,
          });
        }
      }

      if (!licenseType || licenseType === 'Uncategorized') {
        issues.push({
          severity: 'high',
          title: `Dependencies use an atypical license: ${licenseName}`,
          dependencies,
        });
      } else if (licenseType === 'Invalid') {
        issues.push({
          severity: 'high',
          title: `Dependencies use an invalid SPDX license: ${licenseName}`,
          dependencies,
        });
      } else if (licenseType === 'Expression') {
        issues.push({
          severity: 'high',
          title: `Dependencies use a custom license expression: ${licenseName}`,
          dependencies,
        });
      }

      Object.entries(DEFAULT_POLICY).forEach(([severity, includes]) => {
        if (includes.includes(licenseName)) {
          issues.push({
            severity,
            title: `Dependencies use potentially problematic license: ${licenseName}`,
            dependencies,
          });
        } else if (includes.includes(`cat:${licenseType}`)) {
          issues.push({
            severity,
            title: `Dependencies use ${licenseType} license: ${licenseName}`,
            dependencies,
          });
        }
      });
    });

    return issues.reduce(
      (agg, {severity, title, dependencies}) =>
        agg.concat(
          dependencies.map(({name, version}) => ({
            severity,
            title,
            name,
            version,
            findings: getFindings(packageGraph, name, version),
          })),
        ),
      [],
    );
  },
};
