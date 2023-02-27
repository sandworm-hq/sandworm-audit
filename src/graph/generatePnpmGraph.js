const {processDependenciesForPackage, processPlaceholders, makeNode} = require('./utils');

const parsePath = (path) => {
  const parts = path.slice(1).split('/');
  const version = parts.pop();
  const name = parts.join('/');

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
      // In some cases, pnpm appends metadata to the version
      // Ex: `/rollup-plugin-terser/7.0.2_rollup@2.79.1`
      // Ex: `/workbox-webpack-plugin/6.1.5_fa2917c6d78243729a500a2a8fe6cdc5`
      version: version.split('_')[0],
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
