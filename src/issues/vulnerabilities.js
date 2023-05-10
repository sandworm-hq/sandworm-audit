const {exec} = require('child_process');
const {getFindings, reportFromAdvisory} = require('./utils');

const fromNpm = (appPath, packageGraph) =>
  new Promise((resolve, reject) => {
    exec('npm audit --package-lock-only --json', {cwd: appPath}, (err, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      } else {
        try {
          const {vulnerabilities} = JSON.parse(stdout);
          const directIssues = Object.values(vulnerabilities).filter(({via}) =>
            via.find((cause) => typeof cause !== 'string'),
          );

          const reports = [];
          directIssues.forEach(({via, fixAvailable}) => {
            via
              .filter((v) => typeof v !== 'string')
              .forEach((v) => {
                const report = {
                  findings: getFindings({packageGraph, packageName: v.name, range: v.range}),
                  source: v.source,
                  githubAdvisoryId:
                    v.url?.startsWith?.('https://github.com/advisories/') &&
                    v.url.replace('https://github.com/advisories/', ''),
                  name: v.name,
                  title: v.title,
                  // overview missing here,
                  url: v.url,
                  severity: v.severity,
                  range: v.range,
                  recommendation:
                    typeof fixAvailable === 'object'
                      ? `Update ${fixAvailable.name} to ${fixAvailable.version}`
                      : undefined,
                };

                reports.push(report);
              });
          });

          resolve(reports);
        } catch (error) {
          reject(new Error(`${error.message} => ${stdout}`));
        }
      }
    });
  });

const fromYarnClassic = (appPath, packageGraph) =>
  new Promise((resolve, reject) => {
    exec('yarn audit --json', {cwd: appPath}, (err, stdout, stderr) => {
      if (stderr) {
        try {
          const error = stderr.split('\n').find((rawLine) => {
            if (!rawLine) {
              return false;
            }
            const event = JSON.parse(rawLine);
            return event.type === 'error';
          });

          if (error) {
            reject(new Error(error));
            return;
          }
        } catch (error) {
          reject(new Error(stderr));
          return;
        }
      }

      resolve(
        stdout.split('\n').reduce((agg, rawLine) => {
          if (!rawLine) {
            return agg;
          }
          try {
            const event = JSON.parse(rawLine);
            if (event.type === 'auditAdvisory') {
              const {advisory} = event.data;
              const report = reportFromAdvisory(advisory, packageGraph);
              if (!agg.find(({id}) => id === report.id)) {
                agg.push(report);
              }
            }
            return agg;
          } catch (error) {
            return agg;
          }
        }, []),
      );
    });
  });

const fromYarnOrPnpm = (appPath, packageGraph, usePnpm = false) =>
  new Promise((resolve, reject) => {
    exec(
      usePnpm ? 'pnpm audit --json' : 'yarn npm audit --all --recursive --json',
      {cwd: appPath},
      (err, stdout, stderr) => {
        if (stderr) {
          reject(new Error(stderr));
        } else {
          try {
            const reports = [];
            const {advisories} = JSON.parse(stdout || '{"advisories": {}}');
            Object.values(advisories || {}).forEach((advisory) => {
              reports.push(reportFromAdvisory(advisory, packageGraph));
            });

            resolve(reports);
          } catch (error) {
            reject(new Error(`${error.message} => ${stdout}`));
          }
        }
      },
    );
  });

const fromYarn = fromYarnOrPnpm;

const fromPnpm = (appPath, packageGraph) => fromYarnOrPnpm(appPath, packageGraph, true);

const getDependencyVulnerabilities = async ({
  appPath,
  packageManager = 'npm',
  packageGraph = {},
  onProgress = () => {},
}) => {
  let vulnerabilities;

  try {
    if (packageManager === 'npm') {
      onProgress('Getting vulnerability report from npm');
      vulnerabilities = await fromNpm(appPath, packageGraph);
    } else if (packageManager === 'yarn-classic') {
      onProgress('Getting vulnerability report from yarn');
      vulnerabilities = await fromYarnClassic(appPath, packageGraph);
    } else if (packageManager === 'yarn') {
      onProgress('Getting vulnerability report from yarn');
      vulnerabilities = await fromYarn(appPath, packageGraph);
    } else if (packageManager === 'pnpm') {
      onProgress('Getting vulnerability report from pnpm');
      vulnerabilities = await fromPnpm(appPath, packageGraph);
    }
  } catch (error) {
    throw new Error(`Error getting vulnerability report from ${packageManager}: ${error.message}`);
  }

  return vulnerabilities;
};

module.exports = {
  getDependencyVulnerabilities,
};
