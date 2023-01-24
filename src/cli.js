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
  .scriptName('Sinkchart')
  .command(
    '*',
    "Better Visualizations For Your App's Dependencies 🪱",
    (yargs) => {
      yargs
        .option('o', {
          alias: 'output',
          demandOption: false,
          default: '.sinkchart',
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
        .option('t', {
          alias: 'type',
          demandOption: false,
          describe: 'Visualization type',
          type: 'string',
          choices: ['tree', 'treemap'],
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
      logger.log('\x1b[36m%s\x1b[0m', `Sinkchart 🧭`);
      const {default: ora} = await import('ora');

      const {svgs, csv, name, version} = await getReport({
        types: argv.t ? [argv.t] : undefined,
        appPath: argv.p,
        includeDev: argv.d,
        showVersions: argv.v,
        maxDepth: argv.md,
        onProgress: onProgress(ora),
      });

      currentSpinner = ora('Writing Output File').start();
      await Object.keys(svgs).reduce(async (agg, chartType) => {
        await agg;

        const outputPath = path.join(argv.p, argv.o, `${name}@${version}-${chartType}.svg`);
        await fs.mkdir(path.dirname(outputPath), {recursive: true});
        await fs.writeFile(outputPath, svgs[chartType]);
      }, Promise.resolve());
      const csvOutputPath = path.join(argv.p, argv.o, `${name}@${version}-dependencies.csv`);
      await fs.writeFile(csvOutputPath, csv);
      currentSpinner.stopAndPersist({symbol: '✨', text: 'Done'});
    },
  )
  .help()
  .parse();
