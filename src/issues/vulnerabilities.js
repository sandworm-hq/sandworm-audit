const fromComposer = require('./vulnerabilities/composer');
const fromNpm = require('./vulnerabilities/npm');
const fromYarnClassic = require('./vulnerabilities/yarnClassic');
const fromYarnOrPnpm = require('./vulnerabilities/yarnPnpm');

const getDependencyVulnerabilities = async ({
  appPath,
  packageManager = 'npm',
  packageGraph = {},
  onProgress = () => {},
  includeDev,
}) => {
  let vulnerabilities;

  try {
    if (packageManager === 'npm') {
      onProgress('Getting vulnerability report from npm');
      vulnerabilities = await fromNpm({appPath, packageGraph, includeDev});
    } else if (packageManager === 'yarn-classic') {
      onProgress('Getting vulnerability report from yarn');
      vulnerabilities = await fromYarnClassic({appPath, packageGraph, includeDev});
    } else if (packageManager === 'yarn') {
      onProgress('Getting vulnerability report from yarn');
      vulnerabilities = await fromYarnOrPnpm({appPath, packageGraph, includeDev});
    } else if (packageManager === 'pnpm') {
      onProgress('Getting vulnerability report from pnpm');
      vulnerabilities = await fromYarnOrPnpm({appPath, packageGraph, includeDev, usePnpm: true});
    } else if (packageManager === 'composer') {
      onProgress('Getting vulnerability report from composer');
      vulnerabilities = await fromComposer({appPath, packageGraph, includeDev});
    }
  } catch (error) {
    throw new Error(`Error getting vulnerability report from ${packageManager}: ${error.message}`);
  }

  return vulnerabilities;
};

module.exports = {
  getDependencyVulnerabilities,
};
