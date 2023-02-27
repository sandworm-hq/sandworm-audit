const https = require('https');
const semverLib = require('semver');

const parseDependencyString = (depstring) => {
  const parts = depstring.split('@');
  const semver = parts.pop();
  let name;
  let localName;

  if (parts.length === 1) {
    // Parses js-sdsl@^4.1.4
    [name] = parts;
  } else if (parts.length === 2) {
    if (parts[0] === '') {
      // @pnpm/constant@6.1.0
      name = `@${parts[1]}`;
    } else {
      // execa@npm:safe-execa@^0.1.1
      [localName] = parts;
      name = parts[1].replace('npm:', '');
    }
  } else if (parts.length === 3) {
    // js-yaml@npm:@zkochan/js-yaml@^0.0.6
    [localName] = parts;
    name = `@${parts[2]}`;
  } else if (parts.length === 4) {
    // @pnpm/constant@npm:@test/constant@6.1.0
    localName = `@${parts[1]}`;
    name = `@${parts[3]}`;
  }

  return {name, semver, localName: localName || name};
};

const makeNode = (data) => ({
  ...data,
  flags: {},
  dependencies: {},
  devDependencies: {},
  optionalDependencies: {},
  peerDependencies: {},
  bundledDependencies: {},
  parents: {
    dependencies: {},
    devDependencies: {},
    optionalDependencies: {},
    peerDependencies: {},
    bundledDependencies: {},
  },
});

const processDependenciesForPackage = ({dependencies, newPackage, allPackages, placeholders}) => {
  Object.entries({
    ...(dependencies.dependencies && {dependencies: dependencies.dependencies}),
    ...(dependencies.devDependencies && {devDependencies: dependencies.devDependencies}),
    ...(dependencies.optionalDependencies && {
      optionalDependencies: dependencies.optionalDependencies,
    }),
    ...(dependencies.peerDependencies && {peerDependencies: dependencies.peerDependencies}),
    ...(dependencies.bundledDependencies && {
      bundledDependencies: dependencies.bundledDependencies,
    }),
  }).forEach(([dependencyType, dependencyObject]) => {
    Object.entries(dependencyObject || {}).forEach(
      ([originalDependencyName, originalSemverRule]) => {
        const {name: dependencyName, semver: semverRule} = parseDependencyString(
          `${originalDependencyName}@${originalSemverRule}`,
        );

        const dependencyPackage = allPackages.find(
          (pkg) => pkg.name === dependencyName && semverLib.satisfies(pkg.version, semverRule),
        );

        if (dependencyPackage) {
          // eslint-disable-next-line no-param-reassign
          newPackage[dependencyType][dependencyPackage.name] = dependencyPackage;
          dependencyPackage.parents[dependencyType][newPackage.name] = newPackage;
        } else {
          placeholders.push({
            dependencyName,
            semverRule,
            targetPackage: newPackage,
            dependencyType,
          });
        }
      },
    );
  });
};

const processPlaceholders = ({newPackage, placeholders}) => {
  placeholders
    .filter(
      ({dependencyName, semverRule}) =>
        newPackage.name === dependencyName && semverLib.satisfies(newPackage.version, semverRule),
    )
    .forEach((placeholder) => {
      // eslint-disable-next-line no-param-reassign
      placeholder.targetPackage[placeholder.dependencyType][newPackage.name] = newPackage;
      // eslint-disable-next-line no-param-reassign
      newPackage.parents[placeholder.dependencyType][placeholder.targetPackage.name] =
        placeholder.targetPackage;
      placeholders.splice(placeholders.indexOf(placeholder), 1);
    });
};

const postProcessGraph = ({root, processedNodes = [], flags = {}, depth = 0}) => {
  if (!root) {
    return root;
  }

  Object.assign(root.flags, flags);

  if (!processedNodes.includes(root)) {
    // eslint-disable-next-line no-param-reassign
    processedNodes.push(root);

    Object.keys(root).forEach((key) => {
      const value = root[key];
      if (
        key !== 'flags' &&
        (value === undefined ||
          (Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).length === 0))
      ) {
        // eslint-disable-next-line no-param-reassign
        delete root[key];
      }
    });

    if (depth === 0) {
      Object.values(root.dependencies || {}).forEach((dep) => {
        // eslint-disable-next-line no-param-reassign
        dep.flags.prod = true;
      });
    }

    // Flags may mutate during the recursive processing
    // Make a copy of the flags before we start
    const rootFlags = {...root.flags};
    [
      ...Object.values(root.dependencies || {}).map((dep) => ['prod', dep]),
      ...Object.values(root.devDependencies || {}).map((dep) => ['dev', dep]),
      ...Object.values(root.optionalDependencies || {}).map((dep) => ['optional', dep]),
      ...Object.values(root.peerDependencies || {}).map((dep) => ['peer', dep]),
      ...Object.values(root.bundledDependencies || {}).map((dep) => ['bundled', dep]),
    ].forEach(([rel, dep]) => {
      const newFlags = {
        ...(rootFlags.prod && {prod: true}),
        ...((rootFlags.dev || rel === 'dev') && {dev: true}),
        ...((rootFlags.optional || rel === 'optional') && {optional: true}),
        ...((rootFlags.peer || rel === 'peer') && {peer: true}),
        ...((rootFlags.bundled || rel === 'bundled') && {bundled: true}),
      };
      return postProcessGraph({
        root: dep,
        processedNodes,
        flags: newFlags,
        depth: depth + 1,
      });
    });
  }

  return root;
};

const addDependencyGraphData = ({root, processedNodes = [], packageData = []}) => {
  if (!root) {
    return root;
  }

  if (!processedNodes.includes(root)) {
    // eslint-disable-next-line no-param-reassign
    processedNodes.push(root);

    const currentPackageData = packageData.find(
      ({name, version}) => root.name === name && root.version === version,
    );

    if (currentPackageData) {
      let license;
      let licenseData = currentPackageData.license || currentPackageData.licenses;

      try {
        licenseData = JSON.parse(licenseData);
        // eslint-disable-next-line no-empty
      } catch (error) {}

      if (typeof licenseData === 'string') {
        // Standard SPDX field
        license = licenseData;
      } else if (Array.isArray(licenseData)) {
        // Some older packages use an array
        //  {
        //   "licenses" : [
        //     {"type": "MIT", "url": "..."},
        //     {"type": "Apache-2.0", "url": "..."}
        //   ]
        // }
        if (licenseData.length === 1) {
          license = licenseData[0].type;
        } else {
          license = `(${licenseData.map(({type}) => type).join(' OR ')})`;
        }
      } else if (typeof licenseData === 'object') {
        // Some older packages use an object
        // {
        //   "license" : {
        //     "type" : "ISC",
        //     "url" : "..."
        //   }
        // }
        license = licenseData.type;
      }

      Object.assign(root, {
        ...(currentPackageData.relativePath && {relativePath: currentPackageData.relativePath}),
        ...(currentPackageData.engines && {engines: currentPackageData.engines}),
        ...(currentPackageData.size && {size: currentPackageData.size}),
        ...(currentPackageData.deprecated && {deprecated: currentPackageData.deprecated}),
        ...(currentPackageData.repository && {repository: currentPackageData.repository}),
        ...(currentPackageData.bugs && {bugs: currentPackageData.bugs}),
        ...(currentPackageData.scripts && {scripts: currentPackageData.scripts}),
        ...(currentPackageData.published && {published: currentPackageData.published}),
        ...(currentPackageData.dependencies && {
          originalDependencies: currentPackageData.dependencies,
        }),
        ...(currentPackageData.author && {author: currentPackageData.author}),
        ...(currentPackageData.maintainers && {
          maintainers: currentPackageData.maintainers,
        }),
        // eslint-disable-next-line no-underscore-dangle
        ...(currentPackageData._npmUser && {publisher: currentPackageData._npmUser}),
        ...(currentPackageData['dist-tags'] && {
          latestVersion: currentPackageData['dist-tags'].latest,
        }),
        ...(license && {license}),
      });
    }

    [
      ...Object.values(root.dependencies || {}),
      ...Object.values(root.devDependencies || {}),
      ...Object.values(root.optionalDependencies || {}),
      ...Object.values(root.peerDependencies || {}),
      ...Object.values(root.bundledDependencies || {}),
    ].forEach((dep) =>
      addDependencyGraphData({
        root: dep,
        processedNodes,
        packageData,
      }),
    );
  }

  return root;
};

const getRegistryData = (packageName, packageVersion) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'registry.npmjs.org',
        port: 443,
        path: `/${packageName}`,
        method: 'GET',
      },
      (res) => {
        const data = [];

        res.on('data', (chunk) => {
          data.push(chunk);
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(Buffer.concat(data).toString());

            resolve({
              ...response,
              ...(response.versions?.[packageVersion] || {}),
              published: response.time?.[packageVersion],
              size: response.versions?.[packageVersion]?.dist?.unpackedSize,
              versions: undefined,
              time: undefined,
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });

const getRegistryDataMultiple = async (packages) => {
  const errors = [];
  const threadCount = 10;
  const jobCount = Math.ceil(packages.length / threadCount);
  const batchedData = await Promise.all(
    [...Array(threadCount).keys()].map(async (threadIndex) =>
      [...Array(jobCount).keys()].reduce(async (agg, jobIndex) => {
        const prevData = await agg;
        const globalJobIndex = threadIndex * jobCount + jobIndex;

        if (globalJobIndex < packages.length) {
          try {
            const {name, version} = packages[globalJobIndex];
            const packageData = await getRegistryData(name, version);
            return [...prevData, packageData];
          } catch (error) {
            errors.push(error);
            return prevData;
          }
        }

        return prevData;
      }, Promise.resolve([])),
    ),
  );
  return {
    data: batchedData.reduce((agg, batch) => [...agg, ...batch], []),
    errors,
  };
};

module.exports = {
  makeNode,
  parseDependencyString,
  processDependenciesForPackage,
  processPlaceholders,
  postProcessGraph,
  addDependencyGraphData,
  getRegistryData,
  getRegistryDataMultiple,
};
