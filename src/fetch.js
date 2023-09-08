// eslint-disable-next-line no-promise-executor-return
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetch = async (url, opts) => {
  let retryCount = 3;
  const nodeFetch = (await import('node-fetch')).default;

  while (retryCount > 0) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const responseRaw = await nodeFetch(url, opts);
      if (!responseRaw.ok) {
        throw new Error(`Error ${responseRaw.status} from registry: ${responseRaw.statusText}`);
      } else {
        return responseRaw;
      }
    } catch (e) {
      retryCount -= 1;
      if (retryCount === 0) {
        throw e;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }
  }

  throw new Error();
};

module.exports = fetch;
