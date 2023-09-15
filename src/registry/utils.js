const normalizeComposerManifest = (manifest, latestVersion) => {
  const normalizedManifest = {
    ...manifest,
    published: manifest.time,
    repository: manifest.source,
    bugs: manifest.support?.issues,
    dependencies: manifest.require,
    devDependencies: manifest['require-dev'],
    deprecated: manifest.abandoned,
  };

  if (latestVersion) {
    normalizedManifest.latestVersion = latestVersion;
  }

  delete normalizedManifest.support;
  delete normalizedManifest.source;
  delete normalizedManifest.time;
  delete normalizedManifest.require;
  delete normalizedManifest['require-dev'];
  delete normalizedManifest.abandoned;

  return normalizedManifest;
};

module.exports = {normalizeComposerManifest};
