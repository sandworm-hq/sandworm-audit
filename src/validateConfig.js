const SUPPORTED_SEVERITIES = ['critical', 'high', 'moderate', 'low'];

module.exports = ({
  appPath,
  dependencyGraph,
  minDisplayedSeverity,
  width,
  maxDepth,
  loadDataFrom,
  licensePolicy,
  onProgress,
}) => {
  if (!appPath) {
    throw new Error(
      'Application path is required - please provide the path to a directory containing your manifest and a lockfile.',
    );
  }
  if (dependencyGraph && (!dependencyGraph.root || !dependencyGraph.all || !dependencyGraph.prodDependencies)) {
    throw new Error('Provided dependency graph is invalid - missing one or more required fields.');
  }
  if (!SUPPORTED_SEVERITIES.includes(minDisplayedSeverity)) {
    throw new Error(`\`minDisplayedSeverity\` must be one of ${SUPPORTED_SEVERITIES.map(s => `\`${s}\``).join(', ')}.`);
  }
  if (!Number.isInteger(width)) {
    throw new Error('Width must be a valid integer.');
  }
  if (!Number.isInteger(maxDepth)) {
    throw new Error('Max depth must be a valid integer.');
  }
  if (!['registry', 'disk'].includes(loadDataFrom)) {
    throw new Error('`loadDataFrom` must be one of `registry`, `disk`.');
  }
  if (typeof onProgress !== 'function') {
    throw new Error('`onProgress` must be a function.');
  }
  if (licensePolicy) {
    if (typeof licensePolicy !== 'object') {
      throw new Error('License policy must be a valid object.');
    }
    Object.entries(licensePolicy).forEach(([severity, data]) => {
      if (!SUPPORTED_SEVERITIES.includes(severity)) {
        throw new Error(`License policy keys must be one of ${SUPPORTED_SEVERITIES.map(s => `\`${s}\``).join(', ')}.`);
      }
      if (!Array.isArray(data)) {
        throw new Error(`License policy values must be arrays of strings.`);
      }
    });
  }
};
