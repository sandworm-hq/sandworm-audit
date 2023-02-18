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

const isSpdxExpression = (license) => {
  if (!license || license === 'N/A') {
    return false;
  }

  return !!(license.match(/ or /i) || license.match(/ and /i) || license.match(/ with /i));
};

const typeForLicense = (license) => {
  if (!license || license === 'N/A') {
    return 'N/A';
  }
  if (isSpdxExpression(license)) {
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
      const licenseString = license || 'N/A';

      const licenseData = agg.find(({string}) => string === licenseString);

      if (!licenseData) {
        return [
          ...agg,
          {
            string: licenseString,
            meta: {
              type: typeForLicense(licenseString),
              isSpdxExpression: isSpdxExpression(licenseString),
            },
            dependencies: [{name, version}],
          },
        ];
      }

      licenseData.dependencies.push({name, version});
      return agg;
    }, []);

    return licenseUsage.sort((a, b) => b.dependencies.length - a.dependencies.length);
  },

  getLicenseIssues: ({licenseUsage, packageGraph, licensePolicy = DEFAULT_POLICY}) => {
    const issues = [];

    licenseUsage.forEach(({string, meta, dependencies}) => {
      const licenseType = meta?.type;
      if (string === 'N/A') {
        issues.push({
          severity: 'critical',
          title: 'Package has no specified license',
          shortTitle: 'No license specified',
          recommendation: 'Check the package code and files for license information',
          dependencies,
        });
      } else if (string === 'UNLICENSED') {
        issues.push({
          severity: 'critical',
          title: 'Package is explicitly not available for use under any terms',
          shortTitle: 'Not licensed for use',
          recommendation: 'Use another package that is licensed for use',
          dependencies,
        });
      } else if (!isSpdxExpression(string)) {
        if (!licenseGroups.osiApproved.includes(string)) {
          issues.push({
            severity: 'low',
            title: `Package uses a license that is not OSI approved ("${string}")`,
            shortTitle: 'License not OSI approved',
            recommendation: 'Read and validate the license terms',
            dependencies,
          });
        }
        if (licenseGroups.deprecated.includes(string)) {
          issues.push({
            severity: 'low',
            title: `Package uses a deprecated license ("${string}")`,
            shortTitle: 'License is deprecated',
            dependencies,
          });
        }
      }

      if (!licenseType || licenseType === 'Uncategorized') {
        issues.push({
          severity: 'high',
          title: `Package uses an atypical license ("${string}")`,
          shortTitle: 'Atypical license',
          recommendation: 'Read and validate the license terms',
          dependencies,
        });
      } else if (licenseType === 'Invalid') {
        issues.push({
          severity: 'high',
          title: `Package uses an invalid SPDX license ("${string}")`,
          shortTitle: 'Invalid SPDX license',
          recommendation: 'Validate that the package complies with your license policy',
          dependencies,
        });
      } else if (licenseType === 'Expression') {
        issues.push({
          severity: 'high',
          title: `Package uses a custom license expression ("${string}")`,
          shortTitle: 'Custom license expression',
          recommendation: 'Validate that the license expression complies with your license policy',
          dependencies,
        });
      }

      Object.entries(licensePolicy).forEach(([severity, includes]) => {
        if (includes.includes(string)) {
          issues.push({
            severity,
            title: `Package uses a problematic license ("${string}")`,
            shortTitle: 'Problematic license',
            recommendation: 'Validate that the package complies with your license policy',
            dependencies,
          });
        } else if (includes.includes(`cat:${licenseType}`)) {
          issues.push({
            severity,
            title: `Package uses a problematic ${licenseType} license ("${string}")`,
            shortTitle: 'Problematic license',
            recommendation: 'Validate that the package complies with your license policy',
            dependencies,
          });
        }
      });
    });

    return issues.reduce(
      (agg, {severity, title, shortTitle, dependencies, recommendation}) =>
        agg.concat(
          dependencies.map(({name, version}) => ({
            severity,
            title,
            shortTitle,
            name,
            version,
            recommendation,
            findings: getFindings({
              packageGraph,
              packageName: name,
              range: version,
            }),
            type: 'license',
          })),
        ),
      [],
    );
  },
};
