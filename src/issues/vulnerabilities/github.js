const fetch = require('../../fetch');

const fromGitHub = async (githubAdvisoryId) => {
  const responseRaw = await fetch(`https://api.github.com/advisories/${githubAdvisoryId}`);
  const response = await responseRaw.json();
  return response;
};

module.exports = fromGitHub;
