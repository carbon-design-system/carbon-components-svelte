import { $ } from "bun";
import { sveld } from "sveld";

const SVELD_OPTIONS = {
  glob: true,
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
  typesOptions: {
    outDir: "src",
  },
};

console.time("[build-docs]");

await $`rm -f src/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
await sveld(SVELD_OPTIONS);

console.timeEnd("[build-docs]");
