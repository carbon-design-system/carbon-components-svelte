import path from "node:path";
import type { Alias } from "vite";

const carbonRoot = path.resolve(import.meta.dirname, "..");

/**
 * Resolves `carbon-components-svelte` to this checkout, for the docs site
 * and `scripts/render-examples.ts`. An alias bypasses
 * `package.json#exports`, so each subpath export needs its own entry.
 * Array form: the first match wins.
 */
export const carbonAlias: Alias[] = [
  {
    find: /^carbon-components-svelte\/devtools$/,
    replacement: path.join(carbonRoot, "src/devtools/index.js"),
  },
  {
    find: /^carbon-components-svelte\/syntax$/,
    replacement: path.join(carbonRoot, "src/syntax/index.js"),
  },
  {
    find: /^carbon-components-svelte\/tokens$/,
    replacement: path.join(carbonRoot, "src/tokens/index.js"),
  },
  { find: "carbon-components-svelte", replacement: carbonRoot },
];
