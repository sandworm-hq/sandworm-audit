const logger = require('./logger');

const tips = [
  {
    message: 'Configure Sandworm with a config file',
    example: '.sandworm.config.json',
    url: 'https://docs.sandworm.dev/audit/configuration',
  },
  {
    message: 'Tell Sandworm which licenses are disallowed',
    example: 'sandworm-audit --license-policy \'{"critical": ["cat:Network Protective"]}\'',
    url: 'https://docs.sandworm.dev/audit/license-policies',
  },
  {
    message: 'Run Sandworm in your CI to enforce security rules',
    example: 'sandworm audit --skip-all --fail-on=\'["*.critical", "*.high"]\'',
    url: 'https://docs.sandworm.dev/audit/fail-policies',
  },
  {
    message: 'Mark issues as resolved with Sandworm',
    example: 'sandworm resolve ISSUE-ID',
    url: 'https://docs.sandworm.dev/audit/resolving-issues',
  },
  {
    message: 'Save issue resolution info to your repo',
    example: 'resolved-issues.json',
    url: 'https://docs.sandworm.dev/audit/resolving-issues',
  },
];

const tip = () => {
  const currentTipIndex = Math.floor(Math.random() * tips.length);
  const {message, example, url} = tips[currentTipIndex];

  const currentTip = `${logger.colors.DIM}\n//\n// ${logger.colors.RESET}💡 ${
    logger.colors.DIM
  }${message}${example ? `\n//    ${example}` : ''}${
    url ? `\n//    ${logger.colors.UNDERLINE}${url}${logger.colors.RESET}` : ''
  }\n${logger.colors.DIM}//${logger.colors.RESET}\n`;

  return currentTip;
};

module.exports = tip;
