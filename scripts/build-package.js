// @ts-check
import fs from "node:fs";
import path from "node:path";
import pkg from "../package.json" assert { type: "json" };

/** @type {Array<keyof typeof pkg>} */
const keys_to_remove = ["prettier", "standard-version", "devDependencies"];

for (const key of keys_to_remove) {
  delete pkg[key];
}

/** @type {Set<keyof typeof pkg.scripts>} */
const scripts_to_keep = new Set(["postinstall"]);

for (const script in pkg.scripts) {
  // @ts-ignore
  if (!scripts_to_keep.has(script)) {
    delete pkg.scripts[script];
  }
}

// Write the updated package.json file.
const pkgPath = path.join(process.cwd(), "package.json");
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
