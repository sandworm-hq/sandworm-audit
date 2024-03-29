const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');
const {existsWantedLockfile, readWantedLockfile} = require('@pnpm/lockfile-file');
const yarnLockfileParser = require('@yarnpkg/lockfile');
const {parseSyml} = require('@yarnpkg/parsers');

const getCommandVersion = (command) =>
  new Promise((resolve) => {
    exec(`${command} --version`, (err, stdout, stderr) => {
      if (stderr || err) {
        resolve(null);
      } else {
        resolve(stdout?.replace?.('\n', '').match?.(/\d+(\.\d+)+/)?.[0]);
      }
    });
  });

const loadLockfiles = async (appPath) => {
  const lockfiles = {};

  // NPM
  try {
    const lockfileContent = await fs.promises.readFile(path.join(appPath, 'package-lock.json'), {
      encoding: 'utf-8',
    });
    try {
      const lockfileData = JSON.parse(lockfileContent);
      lockfiles.npm = {
        manager: 'npm',
        packageType: 'npm',
        managerVersion: await getCommandVersion('npm'),
        data: lockfileData,
        lockfileVersion: lockfileData.lockfileVersion,
      };
    } catch (err) {
      lockfiles.npm = {
        manager: 'npm',
        packageType: 'npm',
        error: `Could not parse package-lock.json: ${err.message}`,
      };
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // YARN
  try {
    const lockfileContent = await fs.promises.readFile(path.join(appPath, 'yarn.lock'), {
      encoding: 'utf-8',
    });
    const versionMatch = lockfileContent.match(/yarn lockfile v(\d+)/);
    if (versionMatch) {
      try {
        const lockfileData = yarnLockfileParser.parse(lockfileContent);

        if (lockfileData.type === 'success') {
          lockfiles.yarn = {
            manager: 'yarn-classic',
            packageType: 'npm',
            managerVersion: await getCommandVersion('yarn'),
            data: lockfileData.object,
            lockfileVersion: +versionMatch[1],
          };
        } else {
          lockfiles.yarn = {
            manager: 'yarn-classic',
            packageType: 'npm',
            error: 'Unresolved git conflicts',
          };
        }
      } catch (err) {
        lockfiles.yarn = {manager: 'yarn-classic', packageType: 'npm', error: err.message};
      }
    }

    if (lockfileContent.match(/^__metadata:$/m)) {
      try {
        const lockfileData = parseSyml(lockfileContent);
        lockfiles.yarn = {
          manager: 'yarn',
          packageType: 'npm',
          managerVersion: await getCommandVersion('yarn'),
          data: lockfileData,
          // eslint-disable-next-line no-underscore-dangle
          lockfileVersion: +lockfileData.__metadata.version,
        };
      } catch (err) {
        lockfiles.yarn = {
          manager: 'yarn',
          packageType: 'npm',
          error: err.message,
        };
      }
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // PNPM
  if (await existsWantedLockfile(appPath)) {
    try {
      const lockfileData = await readWantedLockfile(appPath, {});
      lockfiles.pnpm = {
        manager: 'pnpm',
        packageType: 'npm',
        managerVersion: await getCommandVersion('pnpm'),
        data: lockfileData,
        lockfileVersion: lockfileData.lockfileVersion,
      };
    } catch (error) {
      lockfiles.pnpm = {manager: 'pnpm', packageType: 'npm', error: error.message};
    }
  }

  // COMPOSER
  try {
    const lockfileContent = await fs.promises.readFile(path.join(appPath, 'composer.lock'), {
      encoding: 'utf-8',
    });
    try {
      const lockfileData = JSON.parse(lockfileContent);
      lockfiles.composer = {
        manager: 'composer',
        packageType: 'composer',
        managerVersion: await getCommandVersion('composer'),
        data: lockfileData,
        lockfileVersion: 1,
      };
    } catch (err) {
      lockfiles.composer = {
        manager: 'composer',
        packageType: 'composer',
        error: `Could not parse composer.lock: ${err.message}`,
      };
    }
    // eslint-disable-next-line no-empty
  } catch {}

  return lockfiles;
};

const loadLockfile = async (appPath, packageType) => {
  const lockfiles = await loadLockfiles(appPath);

  if (packageType === 'npm') {
    return lockfiles.npm || lockfiles.yarn || lockfiles.pnpm;
  }
  if (packageType === 'composer') {
    return lockfiles.composer;
  }
  return lockfiles.npm || lockfiles.yarn || lockfiles.pnpm || lockfiles.composer;
};

module.exports = {
  loadLockfiles,
  loadLockfile,
};
