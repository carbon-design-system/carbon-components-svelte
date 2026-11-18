// Merges the CSS coverage dom-env wrote during a test run
// (`DOM_ENV_CSS_COVERAGE=<dir> DOM_ENV_CSS=css/all.css bunx vitest run`) and
// reports the selectors of the stylesheet no test's DOM matched, by block.
//
//   bun scripts/css-coverage.ts <dir> [css/all.css] [--json out.json]
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { selectorsOf } from "../dom-env/src/coverage.js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { json: { type: "string" } },
});
const [dir, stylesheet = "css/all.css"] = positionals;
const jsonOut = values.json;
if (!dir) {
  console.error(
    "usage: bun scripts/css-coverage.ts <dir> [stylesheet] [--json out.json]",
  );
  process.exit(1);
}

if (!fs.existsSync(stylesheet)) {
  console.error(
    `${stylesheet} not found: build it with \`bun run build:css\`.`,
  );
  process.exit(1);
}
const selectors = selectorsOf(fs.readFileSync(stylesheet, "utf8"));
const covered = new Set<string>();
const unsupported = new Set<string>();
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const part = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  for (const s of part.covered) covered.add(s);
  for (const s of part.unsupported) unsupported.add(s);
}

const BLOCK = /\.bx--([a-z0-9]+(?:-[a-z0-9]+)*)/;
const ELEMENT_PART = /__.*/;
const SOURCE_FILE = /\.(svelte|js|ts)$/;
const CLASS_NAME = /bx--[\w-]*\w/g;
const BUILT_PREFIX = /(bx--[\w-]*)\$\{/g;
const SELECTOR_CLASS = /\.(bx--[\w-]+)/g;

/** The Carbon block a selector styles: its first `bx--` class, or "other". */
const block = (selector: string) =>
  BLOCK.exec(selector)?.[1].replace(ELEMENT_PART, "") ?? "other";

// The `bx--` classes the library's source can produce: literal names, and
// prefixes of names it builds (`bx--btn--${kind}`). A never-matched
// selector needing a class the source can't produce is dead CSS; one whose
// classes the source has is a state no test renders.
const literal = new Set<string>();
const prefixes: string[] = [];
const walk = (d: string) => {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const file = path.join(d, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (SOURCE_FILE.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      const text = fs.readFileSync(file, "utf8");
      for (const [name] of text.matchAll(CLASS_NAME)) literal.add(name);
      for (const [, prefix] of text.matchAll(BUILT_PREFIX))
        prefixes.push(prefix);
    }
  }
};
walk("src");
const producible = (name: string) =>
  literal.has(name) || prefixes.some((prefix) => name.startsWith(prefix));
/** The first class a selector needs that the source can't produce. */
const unproducible = (selector: string) =>
  [...selector.matchAll(SELECTOR_CLASS)]
    .map(([, name]) => name)
    .find((name) => !producible(name));

const uncovered = selectors.filter(
  (s) => !covered.has(s) && !unsupported.has(s),
);
const byBlock = new Map<string, { total: number; missed: string[] }>();
for (const s of selectors) {
  const b = block(s);
  let entry = byBlock.get(b);
  if (!entry) byBlock.set(b, (entry = { total: 0, missed: [] }));
  entry.total++;
  if (!covered.has(s) && !unsupported.has(s)) entry.missed.push(s);
}

const dead = uncovered.filter((s) => unproducible(s));
const deadClasses = new Map<string, number>();
for (const s of dead) {
  const name = unproducible(s) as string;
  deadClasses.set(name, (deadClasses.get(name) ?? 0) + 1);
}

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`;
console.log(
  `${selectors.length} selectors: ${covered.size} matched (${pct(covered.size, selectors.length)}), ${uncovered.length} never matched, ${unsupported.size} dom-env can't parse`,
);
console.log(
  `Of those, ${dead.length} need a class src/ never produces (dead CSS), and ${uncovered.length - dead.length} style states no test renders.`,
);
console.log("\nClasses src/ never produces, by selectors that need them:");
for (const [name, n] of [...deadClasses]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40))
  console.log(`  ${name.padEnd(48)} ${n}`);
const rows = [...byBlock]
  .filter(([, e]) => e.missed.length > 0)
  .sort((a, b) => b[1].missed.length - a[1].missed.length);
console.log("\nNever matched, by block (missed / total):");
for (const [b, e] of rows.slice(0, 40)) {
  console.log(
    `  ${b.padEnd(32)} ${String(e.missed.length).padStart(4)} / ${e.total}`,
  );
}
if (jsonOut) {
  fs.writeFileSync(
    jsonOut,
    JSON.stringify(
      {
        total: selectors.length,
        covered: covered.size,
        unsupported: [...unsupported],
        dead: Object.fromEntries(deadClasses),
        uncovered: Object.fromEntries(rows.map(([b, e]) => [b, e.missed])),
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${jsonOut}`);
}
