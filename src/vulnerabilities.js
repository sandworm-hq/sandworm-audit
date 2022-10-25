const {exec} = require('child_process');
const {rm} = require('fs/promises');
const path = require('path');

const createPackageLock = (appPath) =>
  new Promise((resolve, reject) => {
    exec('npm i --package-lock-only', {cwd: appPath}, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const fromNpm = (appPath) =>
  new Promise((resolve, reject) => {
    exec('npm audit --json', {cwd: appPath}, (err, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      } else {
        try {
          const {vulnerabilities} = JSON.parse(stdout);
          resolve(vulnerabilities);
        } catch (error) {
          reject(error);
        }
      }
    });
  });

const getVulnerabilities = async ({appPath, packageManager = 'npm', onProgress = () => {}}) => {
  if (packageManager === 'yarn') {
    onProgress('Creating temporary npm lockfile');
    await createPackageLock(appPath);
  }
  onProgress('Getting report from npm');
  const vulnerabilities = await fromNpm(appPath);
  if (packageManager === 'yarn') {
    onProgress('Removing temporary npm lockfile');
    await rm(path.join(appPath, 'package-lock.json'));
  }

  return vulnerabilities;
};

module.exports = {
  getVulnerabilities,
};
