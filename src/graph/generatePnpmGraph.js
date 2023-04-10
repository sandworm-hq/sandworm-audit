const {
  processDependenciesForPackage,
  processPlaceholders,
  makeNode,
  SEMVER_REGEXP,
} = require('./utils');

const parsePath = (path) => {
  // parse pnpm lockfile package names like:
  // (lockfile v5)
  // /babel-preset-jest/29.2.0
  // /babel-preset-jest/29.2.0_@babel+core@7.20.7
  // /ts-node/10.9.1_xl7wyiapi7jo5c2pfz5vjm55na
  // (lockfile v6)
  // /@nestjs/schematics/9.1.0(typescript@5.0.3)
  // /ts-node/10.9.1(@types/node@14.18.36)(typescript@4.9.3)
  // see https://github.com/pnpm/pnpm/pull/5810
  const results = path.match(new RegExp(`^/(.*?)/(${SEMVER_REGEXP.source})(.*?)$`));
  const name = results?.[1];
  const version = results?.[2];

  return {name, version};
};

const generatePnpmGraph = ({data, manifest}) => {
  const allPackages = [];
  const placeholders = [];
  const root = makeNode({
    name: manifest.name,
    version: manifest.version,
    engines: manifest.engines,
  });

  processDependenciesForPackage({
    dependencies: {dependencies: manifest.dependencies, devDependencies: manifest.devDependencies},
    newPackage: root,
    allPackages,
    placeholders,
  });

  allPackages.push(root);

  Object.entries(data).forEach(([id, packageData]) => {
    const {
      resolution,
      dev,
      // peerDependenciesMeta
      // transitivePeerDependencies,
    } = packageData;
    const {name, version} = parsePath(id);
    const newPackage = makeNode({
      name,
      version,
      dev,
      ...(resolution && resolution.integrity && {integrity: resolution.integrity}),
    });

    processDependenciesForPackage({
      dependencies: packageData,
      newPackage,
      allPackages,
      placeholders,
    });

    processPlaceholders({newPackage, placeholders});

    allPackages.push(newPackage);
  });

  return {root, allPackages};
};

module.exports = generatePnpmGraph;
