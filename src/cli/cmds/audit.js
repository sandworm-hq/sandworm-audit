const fs = require('fs/promises');
const path = require('path');
const {
  files: {loadConfig},
} = require('@sandworm/utils');
const semver = require('semver');

const {getReport} = require('../..');
const onProgress = require('../progress');
const {getIssueCounts, failIfRequested} = require('../utils');
const summary = require('../summary');
const logger = require('../logger');
const checkUpdates = require('../checkUpdates');
const {outputFilenames, loadManifest} = require('../../files');
const handleCrash = require('../handleCrash');
const tip = require('../tips');
const {UsageError} = require('../../errors');

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
    .option('pt', {
      alias: 'package-type',
      demandOption: false,
      describe: 'The type of package to search for at the given path',
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
    .option('root-vulnerabilites', {
      demandOption: false,
      default: false,
      describe: 'Include vulnerabilities for the root project',
      type: 'boolean',
    })
    .option('skip-license-issues', {
      demandOption: false,
      default: false,
      describe: 'Skip scanning for license issues',
      type: 'boolean',
    })
    .option('skip-meta-issues', {
      demandOption: false,
      default: false,
      describe: 'Skip scanning for meta issues',
      type: 'boolean',
    })
    .option('skip-tree', {
      demandOption: false,
      default: false,
      describe: "Don't output the dependency tree chart",
      type: 'boolean',
    })
    .option('force-tree', {
      demandOption: false,
      default: false,
      describe: 'Force build large dependency tree charts',
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
    })
    .option('show-tips', {
      demandOption: false,
      default: true,
      describe: 'Show usage tips',
      type: 'boolean',
    });

exports.handler = async (argv) => {
  const appPath = argv.path || process.cwd();

  try {
    if (semver.lt(process.versions.node, '14.19.0')) {
      throw new UsageError(
        `Sandworm requires Node >=14.19.0 (currently on ${process.versions.node})`,
      );
    }

    let isOutdated = false;

    (async () => {
      isOutdated = await checkUpdates();
    })();

    logger.logCliHeader();
    const {default: ora} = await import('ora');
    const fileConfig = loadConfig(appPath)?.audit || {};
    const skipOutput =
      typeof fileConfig.skipAll !== 'undefined' ? !!fileConfig.skipAll : argv.skipAll;

    if (argv.licensePolicy) {
      try {
        JSON.parse(argv.licensePolicy);
      } catch (error) {
        throw new UsageError('The provided license policy is not valid JSON');
      }
    }
    if (argv.failOn) {
      try {
        JSON.parse(argv.failOn);
      } catch (error) {
        throw new UsageError('The provided fail policy is not valid JSON');
      }
    }

    const configuration = {
      appPath,
      packageType: argv.packageType,
      includeDev:
        typeof fileConfig.includeDev !== 'undefined' ? fileConfig.includeDev : argv.includeDev,
      skipLicenseIssues:
        typeof fileConfig.skipLicenseIssues !== 'undefined'
          ? fileConfig.skipLicenseIssues
          : argv.skipLicenseIssues,
      skipMetaIssues:
        typeof fileConfig.skipMetaIssues !== 'undefined'
          ? fileConfig.skipMetaIssues
          : argv.skipMetaIssues,
      showVersions:
        typeof fileConfig.showVersions !== 'undefined'
          ? fileConfig.showVersions
          : argv.showVersions,
      rootIsShell:
        typeof fileConfig.rootIsShell !== 'undefined' ? fileConfig.rootIsShell : argv.rootIsShell,
      includeRootVulnerabilities:
        typeof fileConfig.includeRootVulnerabilities !== 'undefined'
          ? fileConfig.includeRootVulnerabilities
          : argv.rootVulnerabilities,
      maxDepth: fileConfig.maxDepth || argv.maxDepth,
      licensePolicy:
        fileConfig.licensePolicy || (argv.licensePolicy && JSON.parse(argv.licensePolicy)),
      minDisplayedSeverity: fileConfig.minDisplayedSeverity || argv.minSeverity,
      loadDataFrom: fileConfig.loadDataFrom || argv.from,
      forceBuildLargeTrees:
        typeof fileConfig.forceBuildLargeTrees !== 'undefined'
          ? fileConfig.forceBuildLargeTrees
          : argv.forceTree,
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
      onProgress: onProgress({ora}),
    };

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
    } = await getReport(configuration);

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

      if (svgs[chartType]) {
        const chartPath = path.join(outputPath, filenames[chartType]);
        await fs.writeFile(chartPath, svgs[chartType]);
      }
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
      delete configuration.appPath;
      const report = {
        name,
        version,
        createdAt: Date.now(),
        system: {
          sandwormVersion,
          nodeVersion: process.versions.node,
          ...(dependencyGraph.root.meta || {}),
        },
        configuration,
        rootVulnerabilities,
        dependencyVulnerabilities,
        licenseUsage,
        licenseIssues,
        metaIssues,
        resolvedIssues,
        errors: errors.map((e) => e.message || e),
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
      errors.forEach((error) => {
        logger.logColor(logger.colors.RED, `❌ ${error.stack || error}`);
      });
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
    } else if (typeof fileConfig.showTips !== 'undefined' ? fileConfig.showTips : argv.showTips) {
      logger.log(tip());
    }

    process.exit();
  } catch (error) {
    await handleCrash(error, appPath);
  }
};
