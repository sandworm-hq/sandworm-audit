const {exec} = require('child_process');
const {reportFromComposerAdvisory} = require('../utils');

const fromComposerRaw = (appPath) =>
  new Promise((resolve, reject) => {
    exec('composer audit --format=json --locked', {cwd: appPath}, (err, stdout) => {
      // composer uses stderr for notifications, ignore it
      try {
        const output = JSON.parse(stdout);
        const allAdvisories = Object.values(output.advisories || {}).reduce(
          (agg, a) => [...agg, ...(Array.isArray(a) ? a : Object.values(a))],
          [],
        );

        resolve(allAdvisories);
      } catch (error) {
        reject(error);
      }
    });
  });

const fromComposer = async ({appPath, packageGraph, includeDev}) => {
  const allAdvisories = await fromComposerRaw(appPath);
  return allAdvisories.reduce(async (aggPromise, advisory) => {
    const agg = await aggPromise;
    return [...agg, await reportFromComposerAdvisory(advisory, packageGraph, includeDev)];
  }, Promise.resolve([]));
};

module.exports = fromComposer;
