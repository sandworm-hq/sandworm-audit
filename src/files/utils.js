const fs = require('fs');

const loadJsonFile = (filePath) => {
  let content;
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath).toString());
  }
  return content;
};

module.exports = {loadJsonFile};
