import { readFile, rm, writeFile } from "node:fs/promises";
import { $ } from "bun";
import { sveld } from "sveld";

const API_FILE = "docs/src/COMPONENT_API.json";
const VIZ_API_FILE = "docs/src/.COMPONENT_API_VIZ.json";

const SVELD_OPTIONS = {
  glob: true,
  json: true,
  jsonOptions: {
    outFile: API_FILE,
  },
  typesOptions: {
    outDir: "src",
  },
};

// `carbon-components-svelte/viz` has its own barrel, so it needs its own
// `index.d.ts`. Its components are folded into the one API file the docs read.
const SVELD_VIZ_OPTIONS = {
  entry: "src/viz/index.js",
  glob: true,
  json: true,
  jsonOptions: {
    outFile: VIZ_API_FILE,
  },
  typesOptions: {
    outDir: "src/viz",
  },
};

type ComponentApi = {
  total: number;
  components: Array<{ moduleName: string }>;
};

async function mergeVizApi() {
  const api = JSON.parse(await readFile(API_FILE, "utf8")) as ComponentApi;
  const viz = JSON.parse(await readFile(VIZ_API_FILE, "utf8")) as ComponentApi;
  await rm(VIZ_API_FILE);
  if (viz.components.length === 0) return;

  const names = new Set(api.components.map((c) => c.moduleName));
  const clash = viz.components.find((c) => names.has(c.moduleName));
  if (clash) {
    throw new Error(
      `[build-docs] viz component "${clash.moduleName}" collides with a core component name`,
    );
  }

  api.components = [...api.components, ...viz.components].sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName),
  );
  api.total = api.components.length;
  await writeFile(API_FILE, `${JSON.stringify(api, null, 2)}\n`);
}

console.time("[build-docs]");

await $`rm -f src/index.d.ts src/viz/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
await sveld(SVELD_OPTIONS);
await sveld(SVELD_VIZ_OPTIONS);
await mergeVizApi();

console.timeEnd("[build-docs]");
