var path = require('path');

module.exports = {
  entry : './src/index.js',
  output : {
    filename    : 're-data-x.js',
    path        : path.resolve(__dirname, 'dist')
  },
  mode : "production",
};
