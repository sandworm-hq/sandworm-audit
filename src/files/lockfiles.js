const fs = require('fs');
const path = require('path');
const {existsWantedLockfile, readWantedLockfile} = require('@pnpm/lockfile-file');
const yarnLockfileParser = require('@yarnpkg/lockfile');
const {parseSyml} = require('@yarnpkg/parsers');

const loadLockfiles = async (appPath) => {
  const lockfiles = {};
  let lockfileFound = false;

  // NPM
  try {
    const lockfileContent = await fs.promises.readFile(path.join(appPath, 'package-lock.json'), {
      encoding: 'utf-8',
    });
    lockfileFound = true;
    try {
      const lockfileData = JSON.parse(lockfileContent);
      lockfiles.npm = {
        manager: 'npm',
        data: lockfileData,
        lockfileVersion: lockfileData.lockfileVersion,
      };
    } catch (err) {
      lockfiles.npm = {manager: 'npm', error: `Could not parse package-lock.json: ${err.message}`};
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // YARN
  try {
    const lockfileContent = await fs.promises.readFile(path.join(appPath, 'yarn.lock'), {
      encoding: 'utf-8',
    });
    lockfileFound = true;
    const versionMatch = lockfileContent.match(/yarn lockfile v(\d+)/);
    if (versionMatch) {
      try {
        const lockfileData = yarnLockfileParser.parse(lockfileContent);

        if (lockfileData.type === 'success') {
          lockfiles.yarn = {
            manager: 'yarn-classic',
            data: lockfileData.object,
            lockfileVersion: +versionMatch[1],
          };
        } else {
          lockfiles.yarn = {manager: 'yarn-classic', error: 'Unresolved git conflicts'};
        }
      } catch (err) {
        lockfiles.yarn = {manager: 'yarn-classic', error: err.message};
      }
    }

    if (lockfileContent.match(/^__metadata:$/m)) {
      try {
        const lockfileData = parseSyml(lockfileContent);
        lockfiles.yarn = {
          manager: 'yarn',
          data: lockfileData,
          // eslint-disable-next-line no-underscore-dangle
          lockfileVersion: +lockfileData.__metadata.version,
        };
      } catch (err) {
        lockfiles.yarn = {
          manager: 'yarn',
          error: err.message,
        };
      }
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // PNPM
  if (await existsWantedLockfile(appPath)) {
    lockfileFound = true;
    try {
      const lockfileData = await readWantedLockfile(appPath, {});
      lockfiles.pnpm = {
        manager: 'pnpm',
        data: lockfileData,
        lockfileVersion: lockfileData.lockfileVersion,
      };
    } catch (error) {
      lockfiles.pnpm = {manager: 'pnpm', error: error.message};
    }
  }

  if (!lockfileFound) {
    throw new Error('No lockfile found');
  }

  return lockfiles;
};

const loadLockfile = async (appPath) => {
  const lockfiles = await loadLockfiles(appPath);

  return lockfiles.npm || lockfiles.yarn || lockfiles.pnpm;
};

module.exports = {
  loadLockfiles,
  loadLockfile,
};
