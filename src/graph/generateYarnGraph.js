const {
  parseDependencyString,
  processDependenciesForPackage,
  processPlaceholders,
  makeNode,
} = require('./utils');

const generateYarnGraph = ({data, manifest}) => {
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
    const {version, resolved, integrity, resolution, checksum} = packageData;
    id.split(', ').forEach((individualId) => {
      const {name} = parseDependencyString(individualId);
      const newPackage = makeNode({
        name,
        version,
        resolved: resolved || resolution,
        integrity: integrity || checksum,
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
  });

  return {root, allPackages};
};

module.exports = generateYarnGraph;
