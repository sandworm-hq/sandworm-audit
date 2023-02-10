#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const {getReport} = require('.');

const logger = console;
let currentSpinner;

const getStartMessage = (stage) => {
  switch (stage) {
    case 'graph':
      return 'Building dependency graph...';
    case 'vulnerabilities':
      return 'Getting vulnerability list...';
    case 'licenses':
      return 'Scanning licenses...';
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
          alias: 'output',
          demandOption: false,
          default: '.sandworm',
          describe: 'The name of the output directory, relative to the application path',
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
          describe: 'Show package versions',
          type: 'boolean',
        })
        .option('p', {
          alias: 'path',
          demandOption: false,
          default: process.cwd(),
          describe: 'The application path',
          type: 'string',
        })
        .option('md', {
          alias: 'max-depth',
          demandOption: false,
          describe: 'Max depth to represent',
          type: 'number',
        });
    },
    async (argv) => {
      logger.log('\x1b[36m%s\x1b[0m', `Sandworm 🪱`);
      logger.log('\x1b[2m%s\x1b[0m', `Security and License Compliance Audit:`);
      const {default: ora} = await import('ora');

      const {
        dependencyGraph,
        svgs,
        csv,
        dependencyVulnerabilities,
        rootVulnerabilities,
        licenseUsage,
        licenseIssues,
        name,
        version,
        errors,
      } = await getReport({
        appPath: argv.p,
        includeDev: argv.d,
        showVersions: argv.v,
        maxDepth: argv.md,
        onProgress: onProgress(ora),
      });

      currentSpinner = ora('Writing Output Files').start();

      const outputPath = path.join(argv.p, argv.o);
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
        errors,
      }
      const reportOutputPath = path.join(outputPath, `${prefix}-report.json`);
      await fs.writeFile(reportOutputPath, JSON.stringify(report, null, 2));

      currentSpinner.stopAndPersist({symbol: '✨', text: 'Done'});
    },
  )
  .help()
  .parse();
