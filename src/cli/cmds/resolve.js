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
  resolutionIdMatchesIssueId,
} = require('../../issues/utils');
const {UsageError} = require('../../errors');
const handleCrash = require('../handleCrash');

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
  const appPath = argv.p || process.cwd();

  try {
    logger.logCliHeader();
    const {issueId} = argv;
    const manifest = loadManifest(appPath);
    const fileConfig = loadConfig(appPath)?.audit || {};
    const outputPath = path.join(appPath, fileConfig.outputPath || argv.o);
    const filenames = outputFilenames(manifest.name, manifest.version);
    const report = loadJsonFile(path.join(outputPath, filenames.json));

    if (!report) {
      throw new UsageError('Report for current version not found. Run an audit first.');
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

    const issuesToResolve = resolvableIssues.filter(({id}) =>
      resolutionIdMatchesIssueId(issueId, id),
    );

    if (issuesToResolve.length === 0) {
      throw new UsageError('Issue not found in current audit results.');
    }

    logger.log(`Resolving issue ${issueId}:`);
    logger.log(`${logger.SEVERITY_ICONS[issuesToResolve[0].severity]} ${issuesToResolve[0].title}`);
    logger.log('');

    const allIssuePaths = issuesToResolve.reduce(
      (agg, i) => [
        ...agg,
        ...i.findings.paths.map((p) => ({path: p, package: `${i.name}@${i.version || i.range}`})),
      ],
      [],
    );

    const selectedPaths = await prompts(
      {
        name: 'paths',
        type: 'multiselect',
        message: 'Select paths to resolve',
        choices: allIssuePaths.map((p) => ({
          title: issuesToResolve.length > 1 ? `${p.package}: ${p.path}` : p.path,
          value: p.path,
          selected: false,
        })),
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
    await handleCrash(error, appPath);
  }
};
