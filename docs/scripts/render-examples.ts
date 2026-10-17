// Server-renders every framed example with `svelte/server` and exits 1 if
// any of them throws. Examples are copied into SvelteKit apps, where code
// that touches `window`, `document`, or `Image` at init crashes SSR.
//
//   cd docs && bun scripts/render-examples.ts
import fs from "node:fs";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer } from "vite";

const DOCS = path.resolve(import.meta.dirname, "..");
const FRAMED = path.join(DOCS, "src/pages/framed");

const server = await createServer({
  configFile: false,
  root: DOCS,
  logLevel: "error",
  // `src/` and the docs each install `svelte`. Bundling it with `dedupe`
  // puts `getContext` and the renderer on the same runtime.
  resolve: {
    alias: { "carbon-components-svelte": path.resolve(DOCS, "..") },
    dedupe: ["svelte"],
  },
  ssr: { noExternal: ["svelte"] },
  plugins: [svelte()],
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true },
});

const { render } = await server.ssrLoadModule("svelte/server");

const examples = fs
  .readdirSync(FRAMED, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".svelte") && !file.startsWith("_"))
  .sort();

// Many examples log their bound values from a `$:` block.
const log = console.log;
console.log = () => {};

const results = await Promise.all(
  examples.map(async (file) => {
    try {
      const { default: component } = await server.ssrLoadModule(
        path.join(FRAMED, file),
      );
      // `render` is lazy: reading `body` runs the component.
      render(component).body;
    } catch (error) {
      return `${file}: ${(error as Error).message.split("\n")[0]}`;
    }
  }),
);
const failures = results.filter((result) => result !== undefined);

console.log = log;
await server.close();

if (failures.length > 0) {
  console.error(
    `${failures.length} of ${examples.length} framed examples throw during SSR:\n`,
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`Rendered ${examples.length} framed examples.`);
