const path = require('path');

module.exports = async ({ config }) => {
  config.module.rules.push({
    test: [/\.stories\.js$/],
    loaders: [require.resolve('@storybook/source-loader')],
    include: [path.resolve(__dirname, '../src')],
    enforce: 'pre'
  });
  return config;
};
