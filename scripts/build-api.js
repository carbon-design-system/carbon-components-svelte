const fs = require("fs");
const path = require("path");
const glob = require("glob");
const pkg = require("../package.json");

function buildApi() {
  const components = {};

  glob.sync("src/**/*.svelte").forEach((file) => {
    const { name } = path.parse(file);
    components[name] = { path: path.join(pkg.name, file) };
  });

  fs.writeFileSync(
    "preprocess/api.json",
    JSON.stringify({ version: pkg.version, components }, null, 2)
  );
}

buildApi();
