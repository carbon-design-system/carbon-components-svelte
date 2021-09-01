import fs from "fs";
import path from "path";
import glob from "glob";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

const components = {};

glob.sync("src/**/*.svelte").forEach((file) => {
  const { name } = path.parse(file);
  components[name] = { path: path.join(pkg.name, file) };
});

fs.writeFileSync(
  "preprocess/api.json",
  JSON.stringify({ version: pkg.version, components }, null, 2)
);
