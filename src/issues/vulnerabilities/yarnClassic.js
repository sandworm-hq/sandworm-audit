const {exec} = require('child_process');
const {reportFromNpmAdvisory} = require('../utils');

const fromYarnClassic = ({appPath, packageGraph, includeDev}) =>
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
              const report = reportFromNpmAdvisory(advisory, packageGraph, includeDev);
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

module.exports = fromYarnClassic;
