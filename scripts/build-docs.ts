import { $ } from "bun";
import { sveld } from "sveld";

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
