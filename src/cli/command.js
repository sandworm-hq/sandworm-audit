#!/usr/bin/env node
const Yargs = require('yargs');

module.exports = (handler) =>
  Yargs.scriptName('Sandworm')
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
          })
          .option('fo', {
            alias: 'fail-on',
            demandOption: false,
            default: '[]',
            describe: 'Fail policy JSON string',
            type: 'string',
          });
      },
      handler,
    )
    .help()
    .parse();
