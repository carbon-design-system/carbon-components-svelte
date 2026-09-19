import { readFileSync } from "node:fs";
import { plugin } from "bun";
import { compile, compileModule } from "svelte/compiler";

const SVELTE_COMPONENT_FILTER = /\.svelte$/;
const SVELTE_MODULE_FILTER = /\.svelte\.(js|ts)$/;

// Bun has no built-in Svelte loader: unknown extensions resolve to a bare
// path string instead of compiled JS. `.svelte.js`/`.svelte.ts` files (rune
// modules, e.g. inside @testing-library/svelte) are compiled as modules
// rather than components, so they need the separate compileModule() API.
plugin({
  name: "svelte-loader",
  setup(build) {
    build.onLoad({ filter: SVELTE_COMPONENT_FILTER }, (args) => {
      const source = readFileSync(args.path, "utf8");
      const { js } = compile(source, {
        filename: args.path,
        generate: "client",
        dev: false,
      });
      return { contents: js.code, loader: "js" };
    });
    build.onLoad({ filter: SVELTE_MODULE_FILTER }, (args) => {
      const source = readFileSync(args.path, "utf8");
      const { js } = compileModule(source, {
        filename: args.path,
        generate: "client",
        dev: false,
      });
      return { contents: js.code, loader: "js" };
    });
  },
});
