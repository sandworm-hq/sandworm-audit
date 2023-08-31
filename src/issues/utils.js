const semverSatisfies = require('semver/functions/satisfies');
const {aggregateDependencies} = require('../charts/utils');
const {UsageError} = require('../errors');
const {SEMVER_REGEXP} = require('../graph/utils');

const getPathsForPackage = (packageGraph, packageName, semver) => {
  const parse = (node, currentPath = [], depth = 0, seenNodes = []) => {
    if (seenNodes.includes(node)) {
      return [];
    }

    const currentNodeValidatesSemver =
      node.name === packageName && semverSatisfies(node.version, semver);
    // For convenience, omit the root package from the path
    // unless we're explicitly searching for the root
    const newPath =
      depth === 0 && !currentNodeValidatesSemver
        ? []
        : [...currentPath, {name: node.name, version: node.version, flags: node.flags}];
    if (currentNodeValidatesSemver) {
      return [newPath];
    }

    return aggregateDependencies(node, true).reduce(
      (agg, subnode) => agg.concat(parse(subnode, newPath, depth + 1, [...seenNodes, node])),
      [],
    );
  };

  return parse(packageGraph);
};

const includesPackage = (set, {name, version} = {}) =>
  set.find(({name: pname, version: pversion}) => name === pname && version === pversion);

const getAllPackagesFromPaths = (paths) =>
  paths.reduce((agg, path) => [...agg, ...path.filter((data) => !includesPackage(agg, data))], []);

const getRootPackagesFromPaths = (paths) =>
  paths.reduce((agg, path) => (includesPackage(agg, path[0]) ? agg : [...agg, path[0]]), []);

const getTargetPackagesFromPaths = (paths) =>
  paths.reduce(
    (agg, path) =>
      includesPackage(agg, path[path.length - 1]) ? agg : [...agg, path[path.length - 1]],
    [],
  );

const getDisplayPaths = (paths) => paths.map((path) => path.map(({name}) => name).join('>'));

const getFindings = ({packageGraph, packageName, range, allPathsAffected = true}) => {
  const allPaths = getPathsForPackage(packageGraph, packageName, range);
  const affects = allPathsAffected
    ? getAllPackagesFromPaths(allPaths)
    : getTargetPackagesFromPaths(allPaths);
  const rootDependencies = getRootPackagesFromPaths(allPaths);
  const paths = getDisplayPaths(allPaths);
  // Paths can grow exponentially in complex dependency graphs
  // Only keep a maximum of 50 paths in the report
  paths.splice(50);
  const sources = getTargetPackagesFromPaths(allPaths);

  return {
    sources,
    affects,
    rootDependencies,
    paths,
  };
};

const reportFromAdvisory = (advisory, packageGraph) => ({
  findings: getFindings({
    packageGraph,
    packageName: advisory.module_name,
    range: advisory.vulnerable_versions,
  }),
  githubAdvisoryId: advisory.github_advisory_id,
  id: advisory.id,
  title: advisory.title,
  url: advisory.url,
  severity: advisory.severity,
  name: advisory.module_name,
  range: advisory.vulnerable_versions,
  type: 'vulnerability',
  recommendation: advisory.recommendation,
  advisory,
});

const allIssuesFromReport = (report) => [
  ...(report.rootVulnerabilities || []),
  ...(report.dependencyVulnerabilities || []),
  ...(report.licenseIssues || []),
  ...(report.metaIssues || []),
];

const makeSandwormIssueId = ({code, name, version, specifier}) =>
  `SWRM-${code}-${name}-${version}${specifier ? `-${specifier}` : ''}`;

const getUniqueIssueId = (issue) => issue.githubAdvisoryId || issue.sandwormIssueId || issue.id;

const resolutionIdMatchesIssueId = (resolutionId, issueId) => {
  if (typeof resolutionId !== 'string' || typeof issueId !== 'string') {
    return false;
  }

  if (resolutionId === issueId) {
    return true;
  }

  if (resolutionId.includes('*')) {
    const [start, end] = resolutionId.split('*');
    if (issueId.startsWith(start) && issueId.endsWith(end)) {
      const wildcardContent = issueId.replace(start, '').replace(end, '');
      if (wildcardContent.match(SEMVER_REGEXP)) {
        return true;
      }
    }
  }

  return false;
};

const excludeResolved = (issues = [], resolved = []) => {
  const filteredIssues = [];

  issues.forEach((issue) => {
    const issueId = getUniqueIssueId(issue);
    const matchingResolutions = resolved.filter(({id}) => resolutionIdMatchesIssueId(id, issueId));
    const matchingResolvedPaths = matchingResolutions.reduce(
      (agg, {paths}) => agg.concat(paths),
      [],
    );
    const unresolvedPaths = issue.findings.paths.filter(
      (path) => !matchingResolvedPaths.includes(path),
    );

    if (unresolvedPaths.length > 0) {
      Object.assign(issue.findings, {paths: unresolvedPaths});
      filteredIssues.push(issue);
    }
  });

  return filteredIssues;
};

const validateResolvedIssues = (resolvedIssues = [], currentIssues = []) => {
  if (!Array.isArray(resolvedIssues)) {
    throw new UsageError('Resolved issues must be array');
  }
  return resolvedIssues.reduce((agg, resolvedIssue) => {
    if (!resolvedIssue.id || !resolvedIssue.paths || !resolvedIssue.notes) {
      throw new UsageError(
        'Each resolved issue must have the following fields: "id", "paths", and "notes"',
      );
    }
    if (!Array.isArray(resolvedIssue.paths)) {
      throw new UsageError('Issue paths must be array');
    }

    const matchingIssues = currentIssues.filter((issue) =>
      resolutionIdMatchesIssueId(resolvedIssue.id, getUniqueIssueId(issue)),
    );

    if (matchingIssues.length === 0) {
      return [
        ...agg,
        `Issue ${resolvedIssue.id} is not present in the latest audit, you can remove it from your resolution file`,
      ];
    }

    return [
      ...agg,
      ...resolvedIssue.paths
        .filter(
          (path) =>
            !matchingIssues.reduce((ag, i) => [...ag, ...i.findings.paths], []).includes(path),
        )
        .map(
          (path) =>
            `Path ${path} for issue ${resolvedIssue.id} is not present in the latest audit, you can remove it from your resolution file`,
        ),
    ];
  }, []);
};

const isWorkspaceProject = (workspace, {name, version}) =>
  (workspace?.workspaceProjects || []).find(
    ({name: projectName, version: projectVersion}) =>
      projectName === name && projectVersion === version,
  );

module.exports = {
  getFindings,
  reportFromAdvisory,
  getUniqueIssueId,
  makeSandwormIssueId,
  excludeResolved,
  allIssuesFromReport,
  validateResolvedIssues,
  resolutionIdMatchesIssueId,
  isWorkspaceProject,
};
