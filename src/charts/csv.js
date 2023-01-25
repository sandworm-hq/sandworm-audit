function jsonToCsv(items) {
  const headerNames = Object.keys(items[0]);
  const rowItems = items.map((row) =>
    headerNames
      .map((fieldName) => JSON.stringify(row[fieldName], (_, value) => value ?? '-'))
      .join(','),
  );
  return [headerNames.join(','), ...rowItems].join('\r\n');
}

module.exports = (dependencies) => {
  const processedDependencies = (dependencies || []).map(
    ({name, version, flags, parents, size, license}) => ({
      name,
      version,
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
    }),
  );

  return {
    csvData: jsonToCsv(processedDependencies),
    jsonData: processedDependencies,
  };
};
