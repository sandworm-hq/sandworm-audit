const fs = require('fs/promises');
const path = require('path');
const {
  files: {loadConfig},
} = require('@sandworm/utils');
const {getReport} = require('../..');
const onProgress = require('../progress');
const {getIssueCounts, failIfRequested} = require('../utils');
const summary = require('../summary');
const logger = require('../logger');
const checkUpdates = require('../checkUpdates');
const {outputFilenames, loadManifest} = require('../../files');
const handleCrash = require('../handleCrash');

exports.command = ['audit', '*'];
exports.desc = "Security & License Compliance For Your App's Dependencies 🪱";
exports.builder = (yargs) =>
  yargs
    .option('o', {
      alias: 'output-path',
      demandOption: false,
      default: 'sandworm',
      describe: 'The path of the output directory, relative to the application path',
      type: 'string',
    })
    .option('d', {
      alias: 'include-dev',
      demandOption: false,
      default: false,
      describe: 'Include dev dependencies',
      type: 'boolean',
    })
    .option('sv', {
      alias: 'show-versions',
      demandOption: false,
      default: false,
      describe: 'Show package versions in chart names',
      type: 'boolean',
    })
    .option('p', {
      alias: 'path',
      demandOption: false,
      describe: 'The path to the application to audit',
      type: 'string',
    })
    .option('md', {
      alias: 'max-depth',
      demandOption: false,
      describe: 'Max depth to represent in charts',
      type: 'number',
    })
    .option('ms', {
      alias: 'min-severity',
      demandOption: false,
      describe: 'Min issue severity to represent in charts',
      type: 'string',
    })
    .option('lp', {
      alias: 'license-policy',
      demandOption: false,
      describe: 'Custom license policy JSON string',
      type: 'string',
    })
    .option('f', {
      alias: 'from',
      demandOption: false,
      default: 'registry',
      describe: 'Load data from "registry" or "disk"',
      type: 'string',
    })
    .option('fo', {
      alias: 'fail-on',
      demandOption: false,
      default: '[]',
      describe: 'Fail policy JSON string',
      type: 'string',
    })
    .option('s', {
      alias: 'summary',
      demandOption: false,
      default: true,
      describe: 'Print a summary of the audit results to the console',
      type: 'boolean',
    })
    .option('rs', {
      alias: 'root-is-shell',
      demandOption: false,
      default: false,
      describe: 'Root project is a shell with a single dependency',
      hidden: true,
      type: 'boolean',
    })
    .option('skip-tree', {
      demandOption: false,
      default: false,
      describe: "Don't output the dependency tree chart",
      type: 'boolean',
    })
    .option('skip-treemap', {
      demandOption: false,
      default: false,
      describe: "Don't output the dependency treemap chart",
      type: 'boolean',
    })
    .option('skip-csv', {
      demandOption: false,
      default: false,
      describe: "Don't output the dependency csv file",
      type: 'boolean',
    })
    .option('skip-report', {
      demandOption: false,
      default: false,
      describe: "Don't output the report json file",
      type: 'boolean',
    })
    .option('skip-all', {
      demandOption: false,
      default: false,
      describe: "Don't output any file",
      type: 'boolean',
    });

exports.handler = async (argv) => {
  const appPath = argv.path || process.cwd();

  try {
    let isOutdated = false;

    (async () => {
      isOutdated = await checkUpdates();
    })();

    logger.logCliHeader();
    const {default: ora} = await import('ora');
    const fileConfig = loadConfig(appPath)?.audit || {};
    const skipOutput =
      typeof fileConfig.skipAll !== 'undefined' ? !!fileConfig.skipAll : argv.skipAll;

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
      resolvedIssues,
      resolvedIssuesAlerts,
      resolvedIssuesCount,
      name,
      version,
      errors,
    } = await getReport({
      appPath,
      includeDev: fileConfig.includeDev || argv.includeDev,
      showVersions: fileConfig.showVersions || argv.showVersions,
      rootIsShell: fileConfig.rootIsShell || argv.rootIsShell,
      maxDepth: fileConfig.maxDepth || argv.maxDepth,
      licensePolicy:
        fileConfig.licensePolicy || (argv.licensePolicy && JSON.parse(argv.licensePolicy)),
      minDisplayedSeverity: fileConfig.minDisplayedSeverity || argv.minSeverity,
      loadDataFrom: fileConfig.loadDataFrom || argv.from,
      output: skipOutput
        ? []
        : [
            !(typeof fileConfig.skipTree !== 'undefined' ? !!fileConfig.skipTree : argv.skipTree) &&
              'tree',
            !(typeof fileConfig.skipTreemap !== 'undefined'
              ? !!fileConfig.skipTreemap
              : argv.skipTreemap) && 'treemap',
            !(typeof fileConfig.skipCsv !== 'undefined' ? !!fileConfig.skipCsv : argv.skipCsv) &&
              'csv',
          ].filter((o) => o),
      onProgress: onProgress(ora),
    });

    // ********************
    // Write output to disk
    // ********************
    const outputSpinner = ora('Writing Output Files').start();
    const filenames = outputFilenames(name, version);
    const outputPath = path.join(appPath, fileConfig.outputPath || argv.outputPath);
    await fs.mkdir(outputPath, {recursive: true});

    // Write charts
    await Object.keys(svgs).reduce(async (agg, chartType) => {
      await agg;

      const chartPath = path.join(outputPath, filenames[chartType]);
      await fs.writeFile(chartPath, svgs[chartType]);
    }, Promise.resolve());

    // Write CSV
    if (csv) {
      const csvOutputPath = path.join(outputPath, filenames.dependenciesCsv);
      await fs.writeFile(csvOutputPath, csv);
    }

    // Write JSON report
    const shouldWriteReport =
      !skipOutput &&
      !(typeof fileConfig.skipReport !== 'undefined' ? !!fileConfig.skipReport : argv.skipReport);
    if (shouldWriteReport) {
      const {version: sandwormVersion} = await loadManifest(path.join(__dirname, '../../..'));
      const report = {
        createdAt: Date.now(),
        system: {
          sandwormVersion,
          nodeVersion: process.versions.node,
          ...(dependencyGraph.root.meta || {}),
        },
        name,
        version,
        rootVulnerabilities,
        dependencyVulnerabilities,
        licenseUsage,
        licenseIssues,
        metaIssues,
        resolvedIssues,
        errors,
      };
      const reportOutputPath = path.join(outputPath, filenames.json);
      await fs.writeFile(reportOutputPath, JSON.stringify(report, null, 2));
    }

    outputSpinner.succeed(shouldWriteReport ? 'Report written to disk' : 'Report done');

    // ***************
    // Display results
    // ***************
    const issuesByType = {
      root: rootVulnerabilities,
      dependencies: dependencyVulnerabilities,
      licenses: licenseIssues,
      meta: metaIssues,
    };
    const {issueCountsByType, issueCountsBySeverity, totalIssueCount} =
      getIssueCounts(issuesByType);

    logger.log('');
    if (resolvedIssuesCount > 0) {
      logger.logColor(
        logger.colors.GREEN,
        `🙌 ${resolvedIssuesCount} ${
          resolvedIssuesCount === 1 ? 'issue' : 'issues'
        } already resolved`,
      );
    }
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

      if (argv.summary) {
        summary(issuesByType);
      }
    } else {
      logger.logColor(logger.colors.CYAN, '✅ Zero issues identified');
    }

    if (resolvedIssuesAlerts?.length) {
      logger.log('');
      resolvedIssuesAlerts.forEach((alert) => {
        logger.log(`⚠️ ${alert}`);
      });
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
    const failOn = fileConfig.failOn || (argv.failOn && JSON.parse(argv.failOn));

    if (failOn) {
      failIfRequested({failOn, issueCountsByType});
    }

    // *********************
    // Outdated notification
    // *********************
    if (isOutdated) {
      logger.log(
        `🔔 ${logger.colors.BG_CYAN}${logger.colors.BLACK}%s${logger.colors.RESET}\n`,
        'New version available! Run "npm i -g @sandworm/audit" to update.',
      );
    }
  } catch (error) {
    await handleCrash(error, appPath);
  }
};
