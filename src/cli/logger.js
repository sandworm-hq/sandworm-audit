const logger = console;
const colors = {
  RESET: '\x1b[0m',
  BLACK: '\x1b[30m',
  CYAN: '\x1b[36m',
  BG_CYAN: '\x1b[46m',
  BG_GRAY: '\x1b[100m',
  RED: '\x1b[31m',
  DIM: '\x1b[2m',
  CRIMSON: '\x1b[38m',
  GREEN: '\x1b[32m',
  UNDERLINE: '\x1b[4m',
};
const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  moderate: '🟡',
  low: '⚪',
};

logger.colors = colors;
logger.SEVERITY_ICONS = SEVERITY_ICONS;
logger.logColor = (color, message) => logger.log(`${color}%s${colors.RESET}`, message);

logger.logCliHeader = () => {
  logger.logColor(logger.colors.CYAN, 'Sandworm 🪱');
  logger.logColor(logger.colors.DIM, 'Security and License Compliance Audit');
};

module.exports = logger;
