const {
  parseDependencyString,
  processDependenciesForPackage,
  processPlaceholders,
  makeNode,
  seedNodes,
} = require('./utils');

const generateYarnGraph = ({data, manifest, workspace}) => {
  const allPackages = [];
  const placeholders = [];

  seedNodes({
    initialNodes: [manifest, ...(workspace?.workspaceProjects || [])],
    allPackages,
    placeholders,
  });

  const root = allPackages[0];

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
