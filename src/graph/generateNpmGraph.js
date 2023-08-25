const {
  processDependenciesForPackage,
  processPlaceholders,
  makeNode,
  seedNodes,
} = require('./utils');

const packageNameFromPath = (path) => {
  // TODO: For locally linked packages this might not include a `node_modules` string
  const parts = path.split('node_modules');
  return parts[parts.length - 1].slice(1);
};

const generateNpmGraph = ({lockfileVersion, data, manifest, workspace}) => {
  const allPackages = [];
  const placeholders = [];

  seedNodes({
    initialNodes: [manifest, ...(workspace?.workspaceProjects || [])],
    allPackages,
    placeholders,
  });

  const root = allPackages[0];

  if (lockfileVersion === 1) {
    const processNode = ([packageName, packageData]) => {
      const {version: packageVersion, resolved, integrity} = packageData;

      if (
        !allPackages.find(({name, version}) => name === packageName && version === packageVersion)
      ) {
        const newPackage = makeNode({
          name: packageName,
          version: packageVersion,
          ...(resolved && {resolved}),
          ...(integrity && {integrity}),
        });

        processDependenciesForPackage({
          dependencies: {dependencies: packageData.requires},
          newPackage,
          allPackages,
          placeholders,
        });

        processPlaceholders({newPackage, placeholders});

        allPackages.push(newPackage);
      }

      if (packageData.dependencies) {
        Object.entries(packageData.dependencies).forEach(processNode);
      }
    };

    processNode([data.name, data]);
  } else {
    Object.entries(data.packages).forEach(([packageLocation, packageData]) => {
      const {name: originalName, version, resolved, integrity} = packageData;
      const name = originalName || packageNameFromPath(packageLocation);

      const newPackage = makeNode({
        name,
        version,
        ...(resolved && {resolved}),
        ...(integrity && {integrity}),
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
  }

  return {root, allPackages};
};

module.exports = generateNpmGraph;
