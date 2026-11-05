import { relative } from "node:path";
import { typecheck } from "svelte-typecheck";

/**
 * Fails when an e2e fixture passes a prop or event its component
 * doesn't have. Svelte drops an unknown prop, so a typo such as
 * `spaceEqual` for `spaceEqually` renders the default and the test checks
 * the wrong thing.
 *
 *   bun run check:fixtures
 *
 * Most fixtures are plain JS, where `"primary"` in an array reads as
 * `string`. Those errors are noise, so only these codes fail:
 */
const CODES = new Set([
  "TS2339", // Property 'x' does not exist on type 'y'
  "TS2353", // Object literal may only specify known properties (a prop)
  "TS2561", // ... known properties, but 'x' does not exist. Did you mean 'y'?
]);

const result = await typecheck({
  workspace: "e2e",
  tsconfig: "tsconfig.fixtures.json",
  checker: "bun",
});

const found = result.diagnostics.filter((d) => CODES.has(d.code));
for (const d of found) {
  const file = relative(process.cwd(), d.file);
  console.error(`${file}:${d.line}:${d.column} ${d.message}`);
}
for (const f of result.failed) {
  console.error(`${f.file}: failed to parse: ${f.message}`);
}
console.log(
  `${result.components} fixtures, ${found.length} unknown props or events`,
);
process.exitCode = found.length > 0 || result.failed.length > 0 ? 1 : 0;
