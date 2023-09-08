const {
  processDependenciesForPackage,
  processPlaceholders,
  makeNode,
  seedNodes,
} = require('./utils');

const generateComposerGraph = ({data, manifest}) => {
  const allPackages = [];
  const placeholders = [];

  seedNodes({
    initialNodes: [
      {
        ...manifest,
        dependencies: manifest.require,
        devDependencies: manifest['require-dev'],
      },
    ],
    allPackages,
    placeholders,
    altTilde: true,
  });

  const root = allPackages[0];

  (data.packages || []).forEach((packageData) => {
    const {name, version} = packageData;

    const newPackage = makeNode({
      name,
      version,
    });

    processDependenciesForPackage({
      dependencies: {
        dependencies: packageData.require,
        devDependencies: packageData['require-dev'],
      },
      newPackage,
      allPackages,
      placeholders,
      altTilde: true,
    });

    processPlaceholders({newPackage, placeholders});

    allPackages.push(newPackage);
  });

  return {root, allPackages};
};

module.exports = generateComposerGraph;
