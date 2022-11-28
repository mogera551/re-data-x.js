var path = require('path');

module.exports = {
  entry : './src/index.js',
  output : {
    filename    : 're-data-x.min.js',
    path        : path.resolve(__dirname, 'dist')
  },
  mode : "production",
};
