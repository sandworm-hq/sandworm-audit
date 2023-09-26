const licenseCatalog = require('./licenses.json');
const {getFindings, makeSandwormIssueId} = require('./utils');

const DEFAULT_LICENSE_CATEGORIES = [
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

const getLicenseCategories = (licensePolicy = DEFAULT_POLICY) => {
  const defaultCategories = licenseCatalog.categories;
  const userCategories = licensePolicy.categories || [];
  const filteredUserCategories = [];

  userCategories.forEach(({name, licenses}) => {
    if (name !== 'Invalid' && DEFAULT_LICENSE_CATEGORIES.includes(name)) {
      defaultCategories.forEach((dc) => {
        // eslint-disable-next-line no-param-reassign
        dc.licenses = dc.licenses.filter((dcl) => !licenses.includes(dcl));
      });
      const targetCategory = defaultCategories.find(({name: targetName}) => name === targetName);
      targetCategory.licenses = [...targetCategory.licenses, ...licenses];
    } else {
      filteredUserCategories.push({name, licenses});
    }
  });

  return {
    defaultCategories,
    userCategories: filteredUserCategories,
  };
};

const getCategoriesForLicense = ({license, defaultCategories, userCategories}) => {
  if (!license || license === 'N/A') {
    return {defaultCategory: 'N/A', userCategories: []};
  }

  let defaultCategory;

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
        const {defaultCategory: cat1} = getCategoriesForLicense({
          license: expressionLicenses[0],
          defaultCategories,
          userCategories,
        });
        const {defaultCategory: cat2} = getCategoriesForLicense({
          license: expressionLicenses[1],
          defaultCategories,
          userCategories,
        });

        if ([cat1, cat2].includes('Invalid')) {
          defaultCategory = 'Invalid';
        } else {
          const aggregateExpressionType =
            DEFAULT_LICENSE_CATEGORIES[
              condition === 'or'
                ? Math.min(
                    DEFAULT_LICENSE_CATEGORIES.indexOf(cat1),
                    DEFAULT_LICENSE_CATEGORIES.indexOf(cat2),
                  )
                : Math.max(
                    DEFAULT_LICENSE_CATEGORIES.indexOf(cat1),
                    DEFAULT_LICENSE_CATEGORIES.indexOf(cat2),
                  )
            ];

          defaultCategory = aggregateExpressionType;
        }
      }
    } else {
      defaultCategory = 'Expression';
    }
  }

  if (!defaultCategory) {
    defaultCategory =
      defaultCategories.find(({licenses}) => licenses.includes(license))?.name || 'Invalid';
  }

  const selectedUserCategories =
    userCategories.filter(({licenses}) => licenses.includes(license)).map((c) => c.name) || [];

  return {defaultCategory, userCategories: selectedUserCategories};
};

const getLicenseUsage = ({dependencies = [], defaultCategories, userCategories}) => {
  const licenseUsage = dependencies.reduce((agg, {name, version, license}) => {
    const licenseString = license || 'N/A';

    const licenseData = agg.find(({string}) => string === licenseString);

    if (!licenseData) {
      return [
        ...agg,
        {
          string: licenseString,
          meta: {
            categories: getCategoriesForLicense({
              license: licenseString,
              defaultCategories,
              userCategories,
            }),
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
};

const getLicenseIssues = ({
  licenseUsage,
  packageGraph,
  licensePolicy = DEFAULT_POLICY,
  includeDev,
}) => {
  const issues = [];

  licenseUsage.forEach(({string, meta, dependencies}) => {
    const defaultCategory = meta?.categories?.defaultCategory;
    const userCategories = meta?.categories?.userCategories || [];

    if (string === 'N/A') {
      issues.push({
        severity: 'critical',
        title: 'Package has no specified license',
        shortTitle: 'No license specified',
        recommendation: 'Check the package code and files for license information',
        dependencies,
        sandwormIssueCode: 100,
      });
    } else if (string === 'UNLICENSED') {
      issues.push({
        severity: 'critical',
        title: 'Package is explicitly not available for use under any terms',
        shortTitle: 'Not licensed for use',
        recommendation: 'Use another package that is licensed for use',
        dependencies,
        sandwormIssueCode: 101,
      });
    } else if (!isSpdxExpression(string)) {
      if (!licenseCatalog.osiApproved.includes(string)) {
        issues.push({
          severity: 'low',
          title: `Package uses a license that is not OSI approved ("${string}")`,
          shortTitle: 'License not OSI approved',
          recommendation: 'Read and validate the license terms',
          dependencies,
          sandwormIssueCode: 102,
        });
      }
      if (licenseCatalog.deprecated.includes(string)) {
        issues.push({
          severity: 'low',
          title: `Package uses a deprecated license ("${string}")`,
          shortTitle: 'License is deprecated',
          dependencies,
          sandwormIssueCode: 103,
        });
      }
    }

    if ((!defaultCategory || defaultCategory === 'Uncategorized') && userCategories.length === 0) {
      issues.push({
        severity: 'high',
        title: `Package uses an atypical license ("${string}")`,
        shortTitle: 'Atypical license',
        recommendation: 'Read and validate the license terms',
        dependencies,
        sandwormIssueCode: 104,
      });
    } else if (defaultCategory === 'Invalid') {
      issues.push({
        severity: 'high',
        title: `Package uses an invalid SPDX license ("${string}")`,
        shortTitle: 'Invalid SPDX license',
        recommendation: 'Validate that the package complies with your license policy',
        dependencies,
        sandwormIssueCode: 105,
      });
    } else if (defaultCategory === 'Expression') {
      issues.push({
        severity: 'high',
        title: `Package uses a custom license expression: \`${string}\``,
        shortTitle: 'Custom license expression',
        recommendation: 'Validate that the license expression complies with your license policy',
        dependencies,
        sandwormIssueCode: 106,
      });
    }

    const allCategoryStrings = [defaultCategory, ...userCategories].map((c) => `cat:${c}`);

    Object.entries(licensePolicy).forEach(([config, includes]) => {
      if (['critical', 'high', 'moderate', 'low'].includes(config)) {
        if (includes.includes(string)) {
          issues.push({
            severity: config,
            title: `Package uses a problematic license ("${string}")`,
            shortTitle: 'Problematic license',
            recommendation: 'Validate that the package complies with your license policy',
            dependencies,
            sandwormIssueCode: 150,
          });
        } else if (includes.find((c) => allCategoryStrings.includes(c))) {
          issues.push({
            severity: config,
            title: `Package uses a problematic ${defaultCategory} license ("${string}")`,
            shortTitle: 'Problematic license',
            recommendation: 'Validate that the package complies with your license policy',
            dependencies,
            sandwormIssueCode: 151,
          });
        }
      }
    });
  });

  return issues.reduce(
    (agg, issue) =>
      agg.concat(
        issue.dependencies.map(({name, version}) => ({
          name,
          version,
          ...issue,
          dependencies: undefined, // this field was just a crutch
          sandwormIssueId: makeSandwormIssueId({
            code: issue.sandwormIssueCode,
            name,
            version,
            specifier: issue.sandwormIssueSpecifier,
          }),
          findings: getFindings({
            packageGraph,
            packageName: name,
            range: version,
            includeDev,
          }),
          type: 'license',
        })),
      ),
    [],
  );
};

module.exports = {
  getLicenseCategories,
  getCategoriesForLicense,
  getLicenseUsage,
  getLicenseIssues,
};
