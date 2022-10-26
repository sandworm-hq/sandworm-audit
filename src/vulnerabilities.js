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

const fromYarn = (appPath) =>
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

const getVulnerabilities = async ({appPath, packageManager = 'npm', onProgress = () => {}}) => {
  let vulnerabilities;

  if (packageManager === 'yarn') {
    onProgress('Getting vulnerability report from yarn');
    vulnerabilities = await fromYarn(appPath);
  } else {
    onProgress('Getting vulnerability report from npm');
    vulnerabilities = await fromNpm(appPath);
  }

  return vulnerabilities;
};

module.exports = {
  getVulnerabilities,
};
