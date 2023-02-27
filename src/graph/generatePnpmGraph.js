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
