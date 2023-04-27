const {reportFromAdvisory} = require('./issues/utils');
const {loadNpmConfigs} = require('./files');

const DEFAULT_REGISTRY_URL = 'https://registry.npmjs.org/';
let registriesInfo = [];
let fetch;

const replaceEnvVars = (str) =>
  str.replace(/\${([^}]+)}/g, (match, variableName) => process.env[variableName] || '');

const getRegistriesInfo = (appPath) => {
  const configs = loadNpmConfigs(appPath);
  const registries = [];
  const authTokens = {};

  Object.entries(configs).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const processedValue = replaceEnvVars(value);
      if (key === 'registry') {
        registries.push({org: 'default', url: processedValue});
      } else if (key?.includes?.(':')) {
        const keyParts = key.split(':');
        const configName = keyParts.pop();
        const specifier = keyParts.join(':');

        if (configName === 'registry') {
          registries.push({org: specifier, url: processedValue});
        } else if (configName === '_authToken') {
          authTokens[specifier] = processedValue;
        }
      }
    }
  });

  // Support the NPM_CONFIG_REGISTRY env var to configure the default registry url
  // Create a default registry entry if none is defined in the npmrc chain
  const envVarRegistryConfig = process.env.npm_config_registry || process.env.NPM_CONFIG_REGISTRY;
  const defaultRegistryInfo = registries.find(({org}) => org === 'default');

  if (defaultRegistryInfo) {
    if (envVarRegistryConfig) {
      defaultRegistryInfo.url = envVarRegistryConfig;
    }
  } else {
    registries.push({
      org: 'default',
      url: envVarRegistryConfig || DEFAULT_REGISTRY_URL,
    });
  }

  Object.entries(authTokens)
    // longest fragment to match a url should win
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([fragment, authToken]) => {
      registries
        .filter(
          ({url, token}) =>
            // match all registries that haven't already been matched
            // and the url includes the fragment
            // strip the last / in the fragment to safely use string.includes
            // as registry url might not end with /
            !token && url.includes(fragment.endsWith('/') ? fragment.slice(0, -1) : fragment),
        )
        .forEach((registry) => Object.assign(registry, {token: authToken}));
    });

  return registries.map((reg) => ({...reg, url: new URL(reg.url)}));
};

const setupRegistries = (appPath) => {
  registriesInfo = getRegistriesInfo(appPath);
};

const getRegistryInfoForPackage = (packageName) => {
  if (packageName.includes('/')) {
    const [packageOrg] = packageName.split('/');
    const orgRegistry = registriesInfo.find(({org}) => org === packageOrg);

    if (orgRegistry) {
      return orgRegistry;
    }
  }

  return registriesInfo.find(({org}) => org === 'default');
};

const getRegistryData = async (packageName, packageVersion) => {
  if (typeof packageName !== 'string' || !['string', 'undefined'].includes(typeof packageVersion)) {
    throw new Error(
      `getRegistryData: invalid arguments given (${packageName} / ${packageVersion})`,
    );
  }

  const registryInfo = getRegistryInfoForPackage(packageName);
  const packageUrl = new URL(`/${packageName}`, registryInfo?.url || DEFAULT_REGISTRY_URL);

  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }

  const responseRaw = await fetch(packageUrl.href, {
    headers: {
      ...(registryInfo?.token && {Authorization: `Bearer ${registryInfo.token}`}),
    },
  });
  const response = await responseRaw.json();
  const requestedVersion = packageVersion || response['dist-tags']?.latest;

  return {
    ...response,
    ...(response.versions?.[requestedVersion] || {}),
    published: response.time?.[requestedVersion],
    size: response.versions?.[requestedVersion]?.dist?.unpackedSize,
    versions: undefined,
    time: undefined,
  };
};

const getRegistryDataMultiple = async (packages, onProgress = () => {}) => {
  const totalCount = packages.length;
  let currentCount = 0;
  const errors = [];
  const data = [];
  const threadCount = 10;
  const packageQueue = [...packages];

  await Promise.all(
    [...Array(threadCount).keys()].map(async () => {
      let currentPackage;
      // eslint-disable-next-line no-cond-assign
      while ((currentPackage = packageQueue.pop())) {
        try {
          const {name, version} = currentPackage;
          // eslint-disable-next-line no-await-in-loop
          const packageData = await getRegistryData(name, version);

          currentCount += 1;
          onProgress?.(`${currentCount}/${totalCount}`);
          data.push(packageData);
        } catch (error) {
          errors.push(error);
        }
      }

      return data;
    }),
  );

  return {
    data,
    errors,
  };
};

const getRegistryAudit = async (packageName, packageVersion, packageGraph) => {
  const registryInfo = getRegistryInfoForPackage(packageName);
  const url = new URL('/-/npm/v1/security/audits', registryInfo?.url || DEFAULT_REGISTRY_URL);
  const responseRaw = await fetch(url.href, {
    method: 'post',
    body: JSON.stringify({
      name: 'sandworm-prompt',
      version: '1.0.0',
      requires: {
        [packageName]: packageVersion,
      },
      dependencies: {
        [packageName]: {
          version: packageVersion,
        },
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      ...(registryInfo?.token && {Authorization: `Bearer ${registryInfo.token}`}),
    },
  });

  if (!responseRaw.ok) {
    throw new Error(`Error ${responseRaw.status} from registry: ${responseRaw.statusText}`);
  }

  const response = await responseRaw.json();

  return Object.values(response.advisories || {}).map((advisory) =>
    reportFromAdvisory(advisory, packageGraph),
  );
};

module.exports = {
  setupRegistries,
  getRegistryData,
  getRegistryDataMultiple,
  getRegistryAudit,
};
