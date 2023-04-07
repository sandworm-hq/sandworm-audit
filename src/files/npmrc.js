const path = require('path');
const fs = require('fs');
const ini = require('ini');
const os = require('os');

module.exports = {
  loadNpmConfigs: (appPath) => {
    try {
      const projectPath = path.join(appPath, '.npmrc');
      const userPath = path.join(os.homedir(), '.npmrc');
      const projectConfigs = fs.existsSync(projectPath)
        ? ini.parse(fs.readFileSync(projectPath, 'utf-8'))
        : {};
      const userConfigs = fs.existsSync(userPath)
        ? ini.parse(fs.readFileSync(userPath, 'utf-8'))
        : {};

      return Object.assign(userConfigs, projectConfigs);
    } catch (error) {
      return {};
    }
  },
};
