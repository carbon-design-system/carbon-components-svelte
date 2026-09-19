import { readFileSync } from "node:fs";
import { plugin } from "bun";
import { compile, compileModule } from "svelte/compiler";

// Bun has no built-in Svelte loader: unknown extensions resolve to a bare
// path string instead of compiled JS. `.svelte.js`/`.svelte.ts` files (rune
// modules, e.g. inside @testing-library/svelte) are compiled as modules
// rather than components, so they need the separate compileModule() API.
plugin({
  name: "svelte-loader",
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, (args) => {
      const source = readFileSync(args.path, "utf8");
      const { js } = compile(source, {
        filename: args.path,
        generate: "client",
        dev: false,
      });
      return { contents: js.code, loader: "js" };
    });
    build.onLoad({ filter: /\.svelte\.(js|ts)$/ }, (args) => {
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
