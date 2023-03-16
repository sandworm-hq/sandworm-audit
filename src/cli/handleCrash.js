const https = require('https');
const path = require('path');
const prompts = require('prompts');
const {UsageError} = require('../errors');
const {loadManifest, loadLockfile} = require('../files');
const logger = require('./logger');

const PUBLIC_ROLLBAR_ACCESS_TOKEN = '7f41bd88e3164d598d6c69a1a88ce6f2';

const trackError = async (error, customData) =>
  new Promise((resolve) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'api.rollbar.com',
        path: '/api/1/item/',
        headers: {
          'X-Rollbar-Access-Token': PUBLIC_ROLLBAR_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        maxRedirects: 20,
      },
      (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          // console.log(Buffer.concat(chunks).toString());
          resolve();
        });

        res.on('error', (err) => {
          logger.error(err);
          resolve();
        });
      },
    );

    const options = JSON.stringify({
      data: {
        environment: 'production',
        body: {
          message: {
            body: error.stack || `${error.name} ${error.message}`,
          },
        },
        platform: 'client',
        level: 'error',
        custom: customData,
      },
    });
    req.write(options);

    req.end();
  });

module.exports = async (error, appPath) => {
  logger.log(`\n❌ Failed: ${error.message}`);
  if (!(error instanceof UsageError)) {
    logger.log(error.stack);

    if (process.stdin.isTTY) {
      let cancelled = false;
      logger.log('');
      const prompt = await prompts(
        {
          name: 'send',
          type: 'select',
          message: 'Send crash report to Sandworm?',
          choices: [
            {title: 'Send with dependency info', value: 'deps'},
            {title: 'Send without dependency info', value: 'no-deps'},
            {title: "Don't send", value: 'no'},
          ],
        },
        {
          onCancel: () => {
            cancelled = true;
          },
        },
      );

      if (!cancelled && prompt.send !== 'no') {
        const {version} = await loadManifest(path.join(__dirname, '../..'));
        const data = {
          sandwormVersion: version,
          nodeVersion: process.versions.node,
        };

        try {
          const lockfileData = await loadLockfile(appPath);

          Object.assign(data, {
            manager: lockfileData.manager,
            managerVersion: lockfileData.managerVersion,
            lockfileVersion: lockfileData.lockfileVersion,
          });
          // eslint-disable-next-line no-empty
        } catch {}

        if (prompt.send === 'deps') {
          try {
            const {dependencies, devDependencies, optionalDependencies, peerDependencies} =
              await loadManifest(appPath);

            Object.assign(data, {
              dependencies: JSON.stringify(dependencies),
              devDependencies: JSON.stringify(devDependencies),
              optionalDependencies: JSON.stringify(optionalDependencies),
              peerDependencies: JSON.stringify(peerDependencies),
            });
            // eslint-disable-next-line no-empty
          } catch {}
        }

        await trackError(error, data);
      }
    }
  }

  process.exit(1);
};
