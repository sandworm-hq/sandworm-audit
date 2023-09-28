const semverLib = require('semver');
const {aggregateDependenciesWithType} = require('../charts/utils');

const SEMVER_REGEXP =
  /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?/;

const parseDependencyString = (depstring) => {
  const parts = depstring.split('@');
  let semver = parts.pop();
  let name;
  let localName;

  if (parts.length === 1) {
    if (semver.startsWith('/')) {
      // Parses the pnpm format execa@/safe-execa/0.1.3
      [, name, semver] = semver.split('/');
      [localName] = parts;
    } else {
      // Parses js-sdsl@^4.1.4
      [name] = parts;
    }
  } else if (parts.length === 2) {
    if (semver.startsWith('/')) {
      // Parses the pnpm format @zkochan/js-yaml@/js-yaml/0.0.6
      [, name, semver] = semver.split('/');
      [, localName] = parts;
      localName = `@${localName}`;
    } else if (parts[1] === '/') {
      // Parses the pnpm format js-yaml@/@zkochan/js-yaml/0.0.6
      const semverParts = semver.split('/');
      name = `@${semverParts[0]}/${semverParts[1]}`;
      [, , semver] = semverParts;
      [localName] = parts;
    } else if (parts[0] === '') {
      // @pnpm/constant@6.1.0
      name = `@${parts[1]}`;
    } else {
      // execa@npm:safe-execa@^0.1.1
      [localName] = parts;
      name = parts[1].replace('npm:', '');
    }
  } else if (parts.length === 3) {
    if (parts[2] === '/') {
      // Parses the pnpm format @test/pck@/@test/pkg/0.0.6
      const semverParts = semver.split('/');
      name = `@${semverParts[0]}/${semverParts[1]}`;
      [, , semver] = semverParts;
      [, localName] = parts;
      localName = `@${localName}`;
    } else {
      // js-yaml@npm:@zkochan/js-yaml@^0.0.6
      [localName] = parts;
      name = `@${parts[2]}`;
    }
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

const processDependenciesForPackage = ({
  dependencies,
  newPackage,
  allPackages,
  placeholders,
  altTilde = false,
}) => {
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
          // In some cases, pnpm appends metadata to the version
          // Ex lockfile v5: `rollup-plugin-terser: 7.0.2_rollup@2.79.1`
          // Ex lockfile v5: `workbox-webpack-plugin: 6.1.5_fa2917c6d78243729a500a2a8fe6cdc5`
          // Ex lockfile v6: `ajv-formats: 2.1.1(ajv@8.12.0)`
          `${originalDependencyName}@${originalSemverRule.split('_')[0].split('(')[0]}`,
        );

        let processedSemverRule = semverRule;
        // By default, semver expands ~1.2 to 1.2.x
        // But composer expands it to >=1.2 <2.0.0
        // Setting altTilde to true enables support for the latter
        if (altTilde) {
          const pattern = semverRule.match(/~(\d+)\.(\d+)/);
          if (pattern) {
            processedSemverRule = `>=${pattern[1]}.${pattern[2]} <${pattern[1] + 1}.0.0`;
          }
        }

        // Composer allows rules like "^3.4|^4.4|^5.0"
        // Semver needs us to expand all single | to ||
        processedSemverRule = processedSemverRule.replace(/(?<!\|)\|(?!\|)/g, '||');

        const dependencyPackage = allPackages.find(
          (pkg) =>
            pkg.name === dependencyName && semverLib.satisfies(pkg.version, processedSemverRule),
        );

        if (dependencyPackage) {
          // eslint-disable-next-line no-param-reassign
          newPackage[dependencyType][dependencyPackage.name] = dependencyPackage;
          dependencyPackage.parents[dependencyType][newPackage.name] = newPackage;
        } else {
          placeholders.push({
            dependencyName,
            semverRule: processedSemverRule,
            targetPackage: newPackage,
            dependencyType,
          });
        }
      },
    );
  });
};

const processPlaceholders = ({newPackage, placeholders}) => {
  let newVersion = newPackage.version;
  if (newVersion && newVersion.startsWith('v')) {
    newVersion = newVersion.slice(1);
  }
  placeholders
    .filter(({dependencyName, semverRule}) => {
      let placeholderSemverRule = semverRule;
      if (placeholderSemverRule.startsWith('v')) {
        placeholderSemverRule = placeholderSemverRule.slice(1);
      }
      return (
        newPackage.name === dependencyName &&
        (newVersion === placeholderSemverRule ||
          semverLib.satisfies(newVersion, placeholderSemverRule))
      );
    })
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
    aggregateDependenciesWithType(root, true).forEach(([rel, dep]) => {
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

const normalizeLicense = (rawLicense) => {
  let license;
  let licenseData = rawLicense;

  if (!rawLicense) {
    return rawLicense;
  }

  try {
    licenseData = JSON.parse(licenseData);
    // eslint-disable-next-line no-empty
  } catch (error) {}

  if (typeof licenseData === 'string') {
    // Standard SPDX field
    license = licenseData;
  } else if (Array.isArray(licenseData)) {
    // Some older npm packages use an array
    //  {
    //   "licenses" : [
    //     {"type": "MIT", "url": "..."},
    //     {"type": "Apache-2.0", "url": "..."}
    //   ]
    // }
    // Composer packages use string arrays
    if (licenseData.length === 1) {
      const onlyLicense = licenseData[0];
      license =
        typeof onlyLicense === 'string' ? onlyLicense : onlyLicense.type || onlyLicense.name;
    } else {
      license = `(${licenseData
        .map((licenseItem) => {
          if (typeof licenseItem === 'string') {
            return licenseItem;
          }
          return licenseItem.type || licenseItem.name;
        })
        .join(' OR ')})`;
    }
  } else if (typeof licenseData === 'object' && licenseData !== null) {
    // Some older npm packages use an object
    // {
    //   "license" : {
    //     "type" : "ISC",
    //     "url" : "..."
    //   }
    // }
    license = licenseData.type || licenseData.name;
  }

  return license;
};

const addDependencyGraphData = async ({
  root,
  processedNodes = [],
  packageData = [],
  packageManager,
  loadDataFrom = false,
  includeDev = false,
  getRegistryData,
  onProgress,
}) => {
  if (!root) {
    return root;
  }

  let errors = [];

  if (!processedNodes.includes(root)) {
    // eslint-disable-next-line no-param-reassign
    processedNodes.push(root);

    let currentPackageData = packageData.find(
      ({name, version}) => root.name === name && root.version === version,
    );
    const shouldLoadMetadata = includeDev || root.flags.prod;

    if (!currentPackageData && loadDataFrom === 'registry' && shouldLoadMetadata) {
      try {
        currentPackageData = await getRegistryData(packageManager, root.name, root.version);
      } catch (e) {
        errors.push(e);
      }
    }

    if (shouldLoadMetadata) {
      onProgress?.();
    }

    if (currentPackageData) {
      const license = normalizeLicense(currentPackageData.licenses || currentPackageData.license);

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

    await Promise.all(
      [
        ...Object.values(root.dependencies || {}),
        ...Object.values(root.devDependencies || {}),
        ...Object.values(root.optionalDependencies || {}),
        ...Object.values(root.peerDependencies || {}),
        ...Object.values(root.bundledDependencies || {}),
      ].map(async (dep) => {
        errors = errors.concat(
          await addDependencyGraphData({
            root: dep,
            processedNodes,
            packageData,
            packageManager,
            loadDataFrom,
            includeDev,
            getRegistryData,
            onProgress,
          }),
        );
      }),
    );
  }

  return errors;
};

const seedNodes = ({initialNodes, allPackages, placeholders, altTilde}) => {
  initialNodes.forEach((nodeManifest) => {
    const node = makeNode({
      name: nodeManifest.name,
      version: nodeManifest.version,
      engines: nodeManifest.engines,
    });

    processDependenciesForPackage({
      dependencies: nodeManifest,
      newPackage: node,
      allPackages,
      placeholders,
      altTilde,
    });

    processPlaceholders({newPackage: node, placeholders});

    allPackages.push(node);
  });
};

module.exports = {
  SEMVER_REGEXP,
  makeNode,
  parseDependencyString,
  processDependenciesForPackage,
  processPlaceholders,
  postProcessGraph,
  addDependencyGraphData,
  normalizeLicense,
  seedNodes,
};
