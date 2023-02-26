const logger = console;
const colors = {
  RESET: '\x1b[0m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  DIM: '\x1b[2m',
  CRIMSON: '\x1b[38m',
};

logger.colors = colors;
logger.logColor = (color, message) => logger.log(`${color}%s${colors.RESET}`, message);

module.exports = logger;
