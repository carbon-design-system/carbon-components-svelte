// Readers copy examples into SvelteKit apps, where code that touches
// `window`, `document`, or `Image` at init crashes SSR.
import fs from "node:fs";
import path from "node:path";
import { svelte } from "svelte-bun";
import { carbonAlias } from "./bun-plugins.ts";
import { siteModule } from "./site-module.ts";

const DOCS = path.resolve(import.meta.dirname, "..");
const FRAMED = path.join(DOCS, "src/pages/framed");
// Under docs/, so `svelte/server` resolves to the copy the examples use.
const TMP = path.join(DOCS, "node_modules/.cache/render-examples");

const examples = fs
  .readdirSync(FRAMED, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".svelte") && !file.startsWith("_"))
  .sort();

// Bundled, not imported: Bun's runtime resolves tsconfig.json's `paths`
// before a runtime plugin, and those map to type declarations.
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const OUT = path.join(TMP, "out");
const entry = path.join(TMP, "render.ts");
fs.writeFileSync(entry, 'export { render } from "svelte/server";\n');
await Bun.build({
  entrypoints: [entry, ...examples.map((file) => path.join(FRAMED, file))],
  root: DOCS,
  outdir: OUT,
  target: "bun",
  splitting: true,
  naming: { entry: "[dir]/[name].[ext]" },
  plugins: [
    carbonAlias,
    siteModule({ dev: false }),
    svelte({ root: DOCS, side: "server", production: true }),
  ],
});
/** Where the build wrote a source file, mirrored under `OUT`. */
const outputOf = (source: string) =>
  path.join(OUT, path.relative(DOCS, source).replace(/\.(svelte|ts)$/, ".js"));
const { render } = await import(outputOf(entry));

// Many examples log their bound values from a `$:` block.
const log = console.log;
console.log = () => {};

const results = await Promise.all(
  examples.map(async (file) => {
    try {
      const { default: component } = await import(
        outputOf(path.join(FRAMED, file))
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- `render` is lazy: reading `body` runs the component.
      render(component).body;
    } catch (error) {
      return `${file}: ${(error as Error).message.split("\n")[0]}`;
    }
  }),
);
const failures = results.filter((result) => result !== undefined);

console.log = log;
fs.rmSync(TMP, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(
    `${failures.length} of ${examples.length} framed examples throw during SSR:\n`,
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`Rendered ${examples.length} framed examples.`);
