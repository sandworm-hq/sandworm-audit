#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const {
  files: {loadConfig},
} = require('@sandworm/utils');
const {getReport} = require('.');

const logger = console;
let currentSpinner;

const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

const getStartMessage = (stage) => {
  switch (stage) {
    case 'graph':
      return 'Building dependency graph...';
    case 'vulnerabilities':
      return 'Getting vulnerability list...';
    case 'licenses':
      return 'Scanning licenses...';
    case 'issues':
      return 'Scanning issues...';
    case 'tree':
      return 'Drawing tree chart...';
    case 'treemap':
      return 'Drawing treemap chart...';
    case 'csv':
      return 'Building CSV...';
    default:
      return '';
  }
};

const getEndMessage = (stage) => {
  switch (stage) {
    case 'graph':
      return 'Built dependency graph';
    case 'vulnerabilities':
      return 'Got vulnerabilities';
    case 'licenses':
      return 'Scanned licenses';
    case 'issues':
      return 'Scanned issues';
    case 'tree':
      return 'Tree chart done';
    case 'treemap':
      return 'Treemap chart done';
    case 'csv':
      return 'CSV done';
    default:
      return '';
  }
};

const onProgress =
  (ora) =>
  ({type, stage, message}) => {
    switch (type) {
      case 'start':
        currentSpinner = ora().start(getStartMessage(stage));
        break;
      case 'end':
        currentSpinner.succeed(getEndMessage(stage));
        break;
      case 'update':
        currentSpinner.text = message;
        break;
      default:
        break;
    }
  };

require('yargs')
  .scriptName('Sandworm')
  .command(
    '*',
    "Security & License Compliance For Your App's Dependencies 🪱",
    (yargs) => {
      yargs
        .option('o', {
          alias: 'output-path',
          demandOption: false,
          default: '.sandworm',
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
        .option('v', {
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
        });
    },
    async (argv) => {
      logger.log('\x1b[36m%s\x1b[0m', `Sandworm 🪱`);
      logger.log('\x1b[2m%s\x1b[0m', `Security and License Compliance Audit`);
      const {default: ora} = await import('ora');
      const appPath = argv.p || process.cwd();

      const fileConfig = loadConfig(appPath)?.audit || {};

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
        maxDepth: fileConfig.maxDepth || argv.md,
        licensePolicy: fileConfig.licensePolicy || (argv.lp && JSON.parse(argv.lp)),
        minDisplayedSeverity: fileConfig.minDisplayedSeverity,
        loadDataFrom: fileConfig.loadDataFrom || argv.f,
        onProgress: onProgress(ora),
      });

      currentSpinner = ora('Writing Output Files').start();

      const outputPath = path.join(appPath, fileConfig.outputPath || argv.o);
      await fs.mkdir(outputPath, {recursive: true});

      const prefix = `${name.replace('/', '-')}@${version}`;

      await Object.keys(svgs).reduce(async (agg, chartType) => {
        await agg;

        const chartPath = path.join(outputPath, `${prefix}-${chartType}.svg`);
        await fs.writeFile(chartPath, svgs[chartType]);
      }, Promise.resolve());

      const csvOutputPath = path.join(outputPath, `${prefix}-dependencies.csv`);
      await fs.writeFile(csvOutputPath, csv);

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

      currentSpinner.succeed('Report written to disk');

      const issueCountsByType = {};
      const issueCountsBySeverity = {};
      Object.entries({
        root: rootVulnerabilities,
        dependencies: dependencyVulnerabilities,
        licenses: licenseIssues,
        meta: metaIssues,
      }).forEach(([type, issues]) => {
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

      if (totalIssueCount > 0) {
        const displayableIssueCount = Object.entries(issueCountsBySeverity).filter(
          ([, count]) => count > 0,
        );

        logger.log(
          '\x1b[36m%s\x1b[0m',
          `⚠️ Identified ${displayableIssueCount
            .map(([severity, count]) => `${count} ${severity} severity`)
            .join(', ')} issues`,
        );
      } else {
        logger.log('\x1b[36m%s\x1b[0m', `✅ Zero issues identified`);
      }

      if (errors.length === 0) {
        logger.log('✨ Done');
      } else {
        logger.log('✨ Done, but with errors:');
        errors.forEach((error) => logger.log('⚠️  \x1b[31m%s\x1b[0m', error));
      }
    },
  )
  .help()
  .parse();
