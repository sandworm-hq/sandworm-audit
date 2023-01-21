const https = require('https');
const semverSatisfies = require('semver/functions/satisfies');

const getPathsForPackage = (packageGraph, packageName, semver) => {
  const parse = (node, currentPath = [], depth = 0) => {
    const newPath = depth === 0 ? [] : [...currentPath, {name: node.name, version: node.version}];
    if (node.name === packageName && semverSatisfies(node.version, semver)) {
      return [newPath];
    }

    return Object.entries(node.dependencies || {}).reduce(
      (agg, [, subnode]) => agg.concat(parse(subnode, newPath, depth + 1)),
      [],
    );
  };

  return parse(packageGraph);
};

const includesPackage = (set, {name, version} = {}) =>
  set.find(({name: pname, version: pversion}) => name === pname && version === pversion);

const getAllPackagesFromPaths = (paths) =>
  paths.reduce((agg, path) => [...agg, ...path.filter((data) => !includesPackage(agg, data))], []);

const getRootPackagesFromPaths = (paths) =>
  paths.reduce((agg, path) => (includesPackage(agg, path[0]) ? agg : [...agg, path[0]]), []);

const getDisplayPaths = (paths) => paths.map((path) => path.map(({name}) => name).join('>'));

const getFindings = (packageGraph, packageName, range) => {
  const allPaths = getPathsForPackage(packageGraph, packageName, range);
  const affects = getAllPackagesFromPaths(allPaths);
  const rootDependencies = getRootPackagesFromPaths(allPaths);
  const paths = getDisplayPaths(allPaths);

  return {
    affects,
    rootDependencies,
    paths,
  };
};

const reportFromAdvisory = (advisory, packageGraph) => ({
  ...advisory,
  findings: getFindings(packageGraph, advisory.module_name, advisory.vulnerable_versions),
  name: advisory.module_name,
  range: advisory.vulnerable_versions,
});

const getReports = (packageName, packageVersion, packageGraph) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'registry.npmjs.org',
        port: 443,
        path: '/-/npm/v1/security/audits',
        method: 'POST',
      },
      (res) => {
        const data = [];

        res.on('data', (chunk) => {
          data.push(chunk);
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(Buffer.concat(data).toString());

            resolve(
              Object.values(response.advisories || {}).map((advisory) =>
                reportFromAdvisory(advisory, packageGraph),
              ),
            );
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.write(
      JSON.stringify({
        name: 'sandworm-prompt',
        version: '1.0.0',
        requires: {
          [packageName]: packageVersion,
        },
        dependencies: {
          [packageName]: {
            version: packageVersion,
          },
        },
      }),
    );

    req.end();
  });

module.exports = {getReports, getFindings, reportFromAdvisory};
