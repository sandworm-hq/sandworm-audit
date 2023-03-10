const path = require('path');
const {
  files: {loadConfig},
} = require('@sandworm/utils');
const prompts = require('prompts');
const logger = require('../logger');
const {loadJsonFile} = require('../../files/utils');
const {
  loadManifest,
  outputFilenames,
  loadResolvedIssues,
  saveResolvedIssues,
} = require('../../files');
const {
  getUniqueIssueId,
  excludeResolved,
  allIssuesFromReport,
  validateResolvedIssues,
} = require('../../issues/utils');

const onCancel = () => {
  logger.log('↩️ Cancelled');
  process.exit();
};

exports.command = 'resolve [issueId]';
exports.desc = "Security & License Compliance For Your App's Dependencies 🪱";
exports.builder = {
  issueId: {
    demandOption: true,
    describe: 'The unique id of the issue to resolve',
    type: 'string',
  },
  p: {
    alias: 'path',
    demandOption: false,
    describe: 'The path to the application to audit',
    type: 'string',
  },
  o: {
    alias: 'output-path',
    demandOption: false,
    default: 'sandworm',
    describe: 'The path of the audit output directory, relative to the application path',
    type: 'string',
  },
};

exports.handler = async (argv) => {
  try {
    logger.logCliHeader();
    const appPath = argv.p || process.cwd();
    const {issueId} = argv;
    const manifest = loadManifest(appPath);
    const fileConfig = loadConfig(appPath)?.audit || {};
    const outputPath = path.join(appPath, fileConfig.outputPath || argv.o);
    const filenames = outputFilenames(manifest.name, manifest.version);
    const report = loadJsonFile(path.join(outputPath, filenames.json));

    if (!report) {
      const error = new Error('Report for current version not found. Run an audit first.');
      error.internal = true;
      throw error;
    }

    const allResolvedIssues = loadResolvedIssues(appPath);

    if (JSON.stringify(allResolvedIssues) !== JSON.stringify(report.resolvedIssues || [])) {
      logger.log('\n⚠️ Report and resolved issues out of sync. Run an audit.\n');
    }

    const currentIssues = allIssuesFromReport(report);
    validateResolvedIssues(allResolvedIssues);

    const resolvableIssues = excludeResolved(currentIssues, allResolvedIssues).map((issue) =>
      Object.assign(issue, {id: getUniqueIssueId(issue)}),
    );

    const issueToResolve = resolvableIssues.find(({id}) => id === issueId);

    if (!issueToResolve) {
      const error = new Error('Issue not found in current audit results.');
      error.internal = true;
      throw error;
    }

    logger.log(`Resolving issue ${issueId}:`);
    logger.log(`${logger.SEVERITY_ICONS[issueToResolve.severity]} ${issueToResolve.title}`);
    logger.log('');

    const selectedPaths = await prompts(
      {
        name: 'paths',
        type: 'multiselect',
        message: 'Select paths to resolve',
        choices: issueToResolve.findings.paths.map((p) => ({title: p, value: p, selected: false})),
        hint: ' - Space to select. Return to submit. "a" to select/deselect all.',
        instructions: false,
        min: 1,
      },
      {onCancel},
    );

    const matchingResolutions = allResolvedIssues.filter(({id}) => id === issueId);
    let targetExistingResolution;

    if (matchingResolutions.length > 0) {
      const target = await prompts(
        {
          name: 'target',
          type: 'select',
          message: 'Create new resolution, or attach to existing one?',
          choices: [
            {title: 'New resolution', value: 'new'},
            ...matchingResolutions.map((resolution) => ({
              title: resolution.notes,
              value: resolution,
            })),
          ],
        },
        {onCancel},
      );

      if (target.target !== 'new') {
        targetExistingResolution = target.target;
      }
    }

    if (!targetExistingResolution) {
      const notes = await prompts(
        {
          name: 'notes',
          type: 'text',
          message: 'Enter resolution notes:',
          validate: (value) => (value.length === 0 ? 'You need to provide resolution notes' : true),
        },
        {onCancel},
      );

      allResolvedIssues.push({
        id: issueId,
        paths: selectedPaths.paths,
        notes: notes.notes,
      });
    } else {
      targetExistingResolution.paths = targetExistingResolution.paths.concat(selectedPaths.paths);
    }

    await saveResolvedIssues(appPath, allResolvedIssues);

    logger.log('');
    logger.log('✨ Done');
  } catch (error) {
    logger.log(`❌ Failed: ${error.message}`);
    if (!error.internal) {
      logger.log(error.stack);
    }
  }
};
