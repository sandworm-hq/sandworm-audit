function jsonToCsv(items) {
  const headerNames = Object.keys(items[0]);
  const rowItems = items.map((row) =>
    headerNames
      .map((fieldName) => {
        let normalized = JSON.stringify(row[fieldName], (_, value) => value ?? '-');

        if (typeof normalized === 'string') {
          normalized = normalized.replace(/\\"/g, '""');
        }

        return normalized;
      })
      .join(','),
  );
  return [headerNames.join(','), ...rowItems].join('\r\n');
}

module.exports = (dependencies) => {
  const processedDependencies = (dependencies || []).map((dep) => {
    const {
      name,
      version,
      flags,
      parents,
      size,
      license,
      repository,
      published,
      publisher,
      latestVersion,
    } = dep;
    return {
      name,
      version,
      latestVersion,
      repository: typeof repository === 'string' ? repository : repository?.url,
      published,
      publisher:
        // eslint-disable-next-line no-nested-ternary
        typeof publisher === 'string'
          ? publisher
          : typeof publisher === 'object'
          ? `${publisher.name}${publisher.email ? ` (${publisher.email})` : ''}`
          : undefined,
      size,
      license,
      isProd: !!flags.prod,
      isDev: !!flags.dev,
      isOptional: !!flags.optional,
      isPeer: !!flags.peer,
      isBundled: !!flags.bundled,
      parents: Object.values(parents || {})
        .reduce(
          (agg, deps) =>
            agg.concat(
              Object.values(deps).map(({name: dname, version: dversion}) => `${dname}@${dversion}`),
            ),
          [],
        )
        .join(','),
    };
  });

  return {
    csvData: jsonToCsv(processedDependencies),
    jsonData: processedDependencies,
  };
};
