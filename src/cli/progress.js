const logger = require('./logger');

let currentSpinner;

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
  ({type, stage, message, progress}) => {
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
      case 'progress':
        currentSpinner.text = `${getStartMessage(stage)} ${logger.colors.DIM}${progress}${
          logger.colors.RESET
        }`;
        break;
      default:
        break;
    }
  };

module.exports = onProgress;
