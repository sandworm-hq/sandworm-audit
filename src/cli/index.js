#!/usr/bin/env node
const Yargs = require('yargs');

// eslint-disable-next-line no-unused-expressions
Yargs(process.argv.slice(2))
  .scriptName('Sandworm')
  .commandDir('cmds')
  .demandCommand()
  .help()
  .alias('v', 'version')
  .describe('v', 'Show version number').argv;
