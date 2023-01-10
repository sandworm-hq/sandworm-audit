const {exec} = require('child_process');

const resolveVulnerabilities = (vulnerabilities) => (name) => {
  const {via} = vulnerabilities[name];

  const aggregated = via
    .map((viaReference) => {
      if (typeof viaReference === 'string') {
        return resolveVulnerabilities(vulnerabilities)(viaReference).map((v) => ({
          ...v,
          via: viaReference,
        }));
      }

      return viaReference;
    })
    .flat(Infinity);

  return [...new Map(aggregated.map((item) => [item.url, item])).values()];
};

const fromNpm = (appPath) =>
  new Promise((resolve, reject) => {
    exec('npm audit --json', {cwd: appPath}, (err, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      } else {
        try {
          const {vulnerabilities} = JSON.parse(stdout);
          const report = Object.keys(vulnerabilities).reduce((agg, module) => {
            const resolvedVulnerabilities = resolveVulnerabilities(vulnerabilities)(module);
            return {
              ...agg,
              [module]: resolvedVulnerabilities,
            };
          }, {});

          resolve(report);
        } catch (error) {
          reject(error);
        }
      }
    });
  });

const fromYarnClassic = (appPath) =>
  new Promise((resolve, reject) => {
    exec('yarn audit --json', {cwd: appPath}, (err, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      } else {
        resolve(
          stdout.split('\n').reduce((agg, rawLine) => {
            if (!rawLine) {
              return agg;
            }
            try {
              const event = JSON.parse(rawLine);
              if (event.type === 'auditAdvisory') {
                const {path} = event.data.resolution;
                const affectedModules = path.split('>');
                const updatedReport = {...agg};

                affectedModules.forEach((module, index) => {
                  if (!updatedReport[module]) {
                    updatedReport[module] = [];
                  }
                  const nextModule = affectedModules[index + 1];

                  if (
                    !updatedReport[module].find(
                      ({via, id}) => id === event.data.advisory.id && via === nextModule,
                    )
                  ) {
                    updatedReport[module].push({...event.data.advisory, via: nextModule});
                  }
                });

                return updatedReport;
              }
              return agg;
            } catch (error) {
              return agg;
            }
          }, {}),
        );
      }
    });
  });

const fromYarnOrPnpm = (appPath, usePnpm = false) =>
  new Promise((resolve, reject) => {
    exec(
      usePnpm ? 'pnpm audit --json' : 'yarn npm audit --all --recursive --json',
      {cwd: appPath},
      (err, stdout, stderr) => {
        if (stderr) {
          reject(new Error(stderr));
        } else {
          try {
            const report = {};
            const {advisories} = JSON.parse(stdout || '{"advisories": {}}');
            Object.values(advisories || {}).forEach((advisory) => {
              const {findings} = advisory;
              findings.forEach(({paths, version}) => {
                paths.forEach((path) => {
                  const components = path.split('>');
                  components.forEach((name, index) => {
                    if (name === '.') {
                      return;
                    }

                    const via = components[index + 1];

                    if (!report[name]) {
                      report[name] = [];
                    }

                    if (!report[name].find(({source}) => source === advisory.id)) {
                      report[name].push({
                        source: advisory.id,
                        name: advisory.module_name,
                        version,
                        title: advisory.title,
                        url: advisory.url,
                        severity: advisory.severity,
                        range: advisory.vulnerable_versions,
                        via,
                      });
                    }
                  });
                });
              });
            });

            resolve(report);
          } catch (error) {
            reject(error);
          }
        }
      },
    );
  });

const fromYarn = fromYarnOrPnpm;

const fromPnpm = (appPath) => fromYarnOrPnpm(appPath, true);

const getVulnerabilities = async ({appPath, packageManager = 'npm', onProgress = () => {}}) => {
  let vulnerabilities;

  if (packageManager === 'npm') {
    onProgress('Getting vulnerability report from npm');
    vulnerabilities = await fromNpm(appPath);
  } else if (packageManager === 'yarn-classic') {
    onProgress('Getting vulnerability report from yarn');
    vulnerabilities = await fromYarnClassic(appPath);
  } else if (packageManager === 'yarn') {
    onProgress('Getting vulnerability report from yarn');
    vulnerabilities = await fromYarn(appPath);
  } else if (packageManager === 'pnpm') {
    onProgress('Getting vulnerability report from pnpm');
    vulnerabilities = await fromPnpm(appPath);
  }

  return vulnerabilities;
};

module.exports = {
  getVulnerabilities,
};
