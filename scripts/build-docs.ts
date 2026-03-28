import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { $ } from "bun";

// Import sveld by file URL so `svelte` resolves to sveld's dependency (Svelte 4). A bare
// `import from "sveld"` under Bun can resolve `svelte/compiler` to the root package (Svelte 5),
// which breaks sveld's static analysis (incompatible compile API).
const sveldEntry = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../node_modules/sveld/lib/index.js",
);
const { sveld } = await import(pathToFileURL(sveldEntry).href);

// Clean auto-generated files.
await $`rm -f src/index.d.ts && find src -name "*.svelte.d.ts" -delete`;

await sveld({
  glob: true,
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
  typesOptions: {
    outDir: "src",
  },
});
