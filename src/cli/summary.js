const logger = require('./logger');

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  moderate: '🟡',
  low: '⚪',
};

const groupIssuesBySeverity = (issuesByType) => {
  const grouped = {
    critical: [],
    high: [],
    moderate: [],
    low: [],
  };

  Object.values(issuesByType || {}).forEach((issues) =>
    (issues || []).forEach((issue) => grouped[issue.severity].push(issue)),
  );

  return grouped;
};

module.exports = (issuesByType) => {
  const issuesBySeverity = groupIssuesBySeverity(issuesByType);
  Object.values(issuesBySeverity).forEach((issues) => {
    issues.forEach((issue) => {
      const {sources} = issue.findings;
      logger.log(
        `${SEVERITY_ICONS[issue.severity]} ${logger.colors.RED}%s${logger.colors.RESET} %s`,
        `${sources[0]?.name}@${sources[0]?.version}`,
        `${issue.shortTitle || issue.title}`,
      );
    });
  });
};
