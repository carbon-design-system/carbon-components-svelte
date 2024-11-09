const fs = require("node:fs");
const path = require("node:path");

const packagePath = path.join(process.cwd(), "package.json");
const package = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const keys_to_remove = ["prettier", "standard-version", "devDependencies"];
const scripts_to_keep = ["postinstall"];

for (const key of keys_to_remove) {
  delete package[key];
}

if (package.scripts) {
  const preserved_scripts = {};

  for (const script of scripts_to_keep) {
    if (package.scripts[script]) {
      preserved_scripts[script] = package.scripts[script];
    }
  }
  
  package.scripts = preserved_scripts;
}

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + "\n");
