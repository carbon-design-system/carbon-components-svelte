const { optimizeImports } = require("carbon-preprocess-svelte");

module.exports = {
  preprocess: [optimizeImports()],
};
