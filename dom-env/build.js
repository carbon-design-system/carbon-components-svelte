// Builds `dist/dom-env.js`: the DOM as one classic script, which the vitest
// adapter evaluates inside each test file's VM context. Rolldown, which
// Vite already uses, so the build runs on Node as well as Bun.
//
//   node build.js [outfile]

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "rolldown";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @param {string} [outFile] */
export async function buildBundle(
  outFile = path.join(here, "dist/dom-env.js"),
) {
  await build({
    input: path.join(here, "src/index.js"),
    platform: "browser",
    logLevel: "silent",
    output: { file: outFile, format: "iife" },
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await buildBundle(process.argv[2]);
}
