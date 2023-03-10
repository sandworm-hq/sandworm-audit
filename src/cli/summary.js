const {getUniqueIssueId} = require('../issues/utils');
const logger = require('./logger');

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
        `${logger.SEVERITY_ICONS[issue.severity]} ${logger.colors.RED}%s${logger.colors.RESET} %s ${
          logger.colors.DIM
        }%s${logger.colors.RESET}`,
        `${sources[0]?.name}@${sources[0]?.version}`,
        `${issue.shortTitle || issue.title}`,
        `${getUniqueIssueId(issue)}`,
      );
    });
  });
};
