const normalizeComposerManifest = (manifest, latestVersion) => {
  const normalizedManifest = {
    ...manifest,
    published: manifest.time,
    repository: manifest.source,
    bugs: manifest.support?.issues,
    dependencies: manifest.require,
    devDependencies: manifest['require-dev'],
  };

  if (latestVersion) {
    normalizedManifest.latestVersion = latestVersion;
  }

  delete normalizedManifest.support;
  delete normalizedManifest.source;
  delete normalizedManifest.time;
  delete normalizedManifest.require;
  delete normalizedManifest['require-dev'];

  return normalizedManifest;
};

module.exports = {normalizeComposerManifest};
