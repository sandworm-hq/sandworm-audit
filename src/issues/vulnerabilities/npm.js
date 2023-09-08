const {exec} = require('child_process');
const {getFindings} = require('../utils');

const fromNpm = ({appPath, packageGraph, includeDev}) =>
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
                  findings: getFindings({
                    packageGraph,
                    packageName: v.name,
                    range: v.range,
                    includeDev,
                  }),
                  source: v.source,
                  githubAdvisoryId:
                    v.url?.startsWith?.('https://github.com/advisories/') &&
                    v.url.replace('https://github.com/advisories/', ''),
                  name: v.name,
                  title: v.title,
                  type: 'vulnerability',
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

module.exports = fromNpm;
