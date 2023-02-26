const logger = require('./logger');

const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

const getIssueCounts = (issuesByType) => {
  const issueCountsByType = {};
  const issueCountsBySeverity = {};
  Object.entries(issuesByType).forEach(([type, issues]) => {
    issueCountsByType[type] = {};
    SEVERITIES.forEach((severity) => {
      const count = (issues || []).filter(
        ({severity: issueSeverity}) => issueSeverity === severity,
      ).length;
      issueCountsByType[type][severity] = count;
      issueCountsBySeverity[severity] = (issueCountsBySeverity[severity] || 0) + count;
    });
  });
  const totalIssueCount = Object.values(issueCountsBySeverity).reduce(
    (agg, count) => agg + count,
    0,
  );

  return {
    issueCountsByType,
    issueCountsBySeverity,
    totalIssueCount,
  };
};

const failIfRequested = ({failOn, issueCountsByType}) => {
  Object.entries(issueCountsByType).forEach(([issueType, typeCountBySeverity]) => {
    Object.entries(typeCountBySeverity).forEach(([issueSeverity, count]) => {
      if (count > 0) {
        failOn.forEach((failOnOption) => {
          const [failType, failSeverity] = failOnOption.split('.');
          if (
            (failType === '*' && failSeverity === '*') ||
            (failType === issueType && failSeverity === issueSeverity) ||
            (failType === '*' && failSeverity === issueSeverity) ||
            (failType === issueType && failSeverity === '*')
          ) {
            logger.logColor(logger.colors.RED, `❌ Failing because of rule "${failOnOption}"`);
            process.exit(1);
          }
        });
      }
    });
  });
};

module.exports = {
  getIssueCounts,
  failIfRequested,
};
