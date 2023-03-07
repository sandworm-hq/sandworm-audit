#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const {
  files: {loadConfig},
} = require('@sandworm/utils');
const {getReport} = require('..');
const onProgress = require('./progress');
const {getIssueCounts, failIfRequested} = require('./utils');
const command = require('./command');
const summary = require('./summary');
const logger = require('./logger');
const checkUpdates = require('./checkUpdates');

command(async (argv) => {
  logger.logColor(logger.colors.CYAN, 'Sandworm 🪱');
  logger.logColor(logger.colors.DIM, 'Security and License Compliance Audit');
  const {default: ora} = await import('ora');
  const appPath = argv.p || process.cwd();
  const fileConfig = loadConfig(appPath)?.audit || {};

  // *****************
  // Perform the audit
  // *****************
  const {
    dependencyGraph,
    svgs,
    csv,
    dependencyVulnerabilities,
    rootVulnerabilities,
    licenseUsage,
    licenseIssues,
    metaIssues,
    name,
    version,
    errors,
  } = await getReport({
    appPath,
    includeDev: fileConfig.includeDev || argv.d,
    showVersions: fileConfig.showVersions || argv.v,
    rootIsShell: fileConfig.rootIsShell || argv.rs,
    maxDepth: fileConfig.maxDepth || argv.md,
    licensePolicy: fileConfig.licensePolicy || (argv.lp && JSON.parse(argv.lp)),
    minDisplayedSeverity: fileConfig.minDisplayedSeverity,
    loadDataFrom: fileConfig.loadDataFrom || argv.f,
    onProgress: onProgress(ora),
  });

  // ********************
  // Write output to disk
  // ********************
  const outputSpinner = ora('Writing Output Files').start();
  const prefix = `${name.replace('/', '-')}@${version}`;
  const outputPath = path.join(appPath, fileConfig.outputPath || argv.o);
  await fs.mkdir(outputPath, {recursive: true});

  // Write charts
  await Object.keys(svgs).reduce(async (agg, chartType) => {
    await agg;

    const chartPath = path.join(outputPath, `${prefix}-${chartType}.svg`);
    await fs.writeFile(chartPath, svgs[chartType]);
  }, Promise.resolve());

  // Write CSV
  const csvOutputPath = path.join(outputPath, `${prefix}-dependencies.csv`);
  await fs.writeFile(csvOutputPath, csv);

  // Write JSON report
  const report = {
    createdAt: Date.now(),
    packageManager: dependencyGraph.root.meta?.packageManager,
    name,
    version,
    rootVulnerabilities,
    dependencyVulnerabilities,
    licenseUsage,
    licenseIssues,
    metaIssues,
    errors,
  };
  const reportOutputPath = path.join(outputPath, `${prefix}-report.json`);
  await fs.writeFile(reportOutputPath, JSON.stringify(report, null, 2));

  outputSpinner.succeed('Report written to disk');

  // ***************
  // Display results
  // ***************
  const issuesByType = {
    root: rootVulnerabilities,
    dependencies: dependencyVulnerabilities,
    licenses: licenseIssues,
    meta: metaIssues,
  };
  const {issueCountsByType, issueCountsBySeverity, totalIssueCount} = getIssueCounts(issuesByType);

  logger.log('');
  if (totalIssueCount > 0) {
    const displayableIssueCount = Object.entries(issueCountsBySeverity).filter(
      ([, count]) => count > 0,
    );

    logger.logColor(
      logger.colors.CYAN,
      `⚠️ Identified ${displayableIssueCount
        .map(([severity, count]) => `${count} ${severity} severity`)
        .join(', ')} issues`,
    );

    if (argv.s) {
      summary(issuesByType);
    }
  } else {
    logger.logColor(logger.colors.CYAN, '✅ Zero issues identified');
  }

  logger.log('');
  if (errors.length === 0) {
    logger.log('✨ Done');
  } else {
    logger.log('✨ Done, but with errors:');
    errors.forEach((error) => logger.logColor(logger.colors.RED, `❌ ${error}`));
    logger.logColor(logger.colors.RED, '❌ Failing because of errors');
    process.exit(1);
  }

  // *****************
  // Fail if requested
  // *****************
  const failOn = fileConfig.failOn || (argv.fo && JSON.parse(argv.fo));

  if (failOn) {
    failIfRequested({failOn, issueCountsByType});
  }

  // *****************
  // Check for updates
  // *****************
  try {
    await checkUpdates();
    // eslint-disable-next-line no-empty
  } catch (error) {}
});
