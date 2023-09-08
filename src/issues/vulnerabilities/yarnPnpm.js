const {exec} = require('child_process');
const {reportFromNpmAdvisory} = require('../utils');

const fromYarnOrPnpm = ({appPath, packageGraph, usePnpm = false, includeDev}) =>
  new Promise((resolve, reject) => {
    exec(
      usePnpm ? 'pnpm audit --json' : 'yarn npm audit --recursive --json',
      {cwd: appPath},
      (err, stdout, stderr) => {
        if (stderr) {
          reject(new Error(stderr));
        } else {
          try {
            const reports = [];
            const {advisories} = JSON.parse(stdout || '{"advisories": {}}');
            Object.values(advisories || {}).forEach((advisory) => {
              reports.push(reportFromNpmAdvisory(advisory, packageGraph, includeDev));
            });

            resolve(reports);
          } catch (error) {
            reject(new Error(`${error.message} => ${stdout}`));
          }
        }
      },
    );
  });

module.exports = fromYarnOrPnpm;
