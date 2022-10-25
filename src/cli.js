#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const {getTreeSVG, getTreemapSVG} = require('.');

const logger = console;
let currentSpinner;

const getStartMessage = (stage) => {
  switch (stage) {
    case 'sizes':
      return 'Getting sizes...';
    case 'vulnerabilities':
      return 'Getting vulnerability list';
    case 'chart':
      return 'Plotting chart';
    default:
      return '';
  }
};

const getEndMessage = (stage) => {
  switch (stage) {
    case 'sizes':
      return 'Computed package sizes';
    case 'vulnerabilities':
      return 'Got vulnerabilities';
    case 'chart':
      return 'Plotted chart';
    default:
      return '';
  }
};

const onProgress = (ora) => ({type, stage, message}) => {
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
          describe: 'The name of the output SVG file',
          type: 'string',
        })
        .option('d', {
          alias: 'dev',
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
          default: 'tree',
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
          type: 'boolean',
        });
    },
    async (argv) => {
      let svgData;
      logger.log('\x1b[36m%s\x1b[0m', `Sinkchart 🧭`);
      const {default: ora} = await import('ora');

      const options = {
        appPath: argv.p,
        includeDev: argv.d,
        showVersions: argv.v,
        maxDepth: argv.md,
        onProgress: onProgress(ora),
      };

      if (argv.t === 'tree') {
        logger.log('Generating Tree');
        svgData = await getTreeSVG(options);
      } else {
        logger.log('Generating Treemap');
        svgData = await getTreemapSVG(options);
      }

      if (svgData) {
        const defaultOutputFilename = `dependency-${argv.t}.svg`;
        const outputPath = argv.o || path.join(argv.p, defaultOutputFilename);
        currentSpinner = ora('Writing Output File').start();
        await fs.mkdir(path.dirname(outputPath), {recursive: true});
        await fs.writeFile(outputPath, svgData);
        currentSpinner.stopAndPersist({symbol: '✨', text: 'Done'});
      }
    },
  )
  .help()
  .parse();
