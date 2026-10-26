import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  type Change,
  compare,
  countByFile,
  parseErrors,
} from "./lib/svelte-types";

/**
 * Type-checks the component scripts in `src/` (`checkJs`, through
 * `tsconfig.svelte-types.json`) and holds each component to its error
 * count in `svelte-types-baseline.json`. Fails when a component gains an
 * error, or when one loses errors and the baseline still has the old count.
 *
 *   bun run test:src-svelte-types [--update]
 *
 * `--update` rewrites the baseline to the current counts. Run it after
 * fixing errors; a new error should be fixed, not added to the baseline.
 * Run `bun run build:docs` first: components import each other's `.d.ts`.
 */
const { values } = parseArgs({
  options: { update: { type: "boolean", default: false } },
});

const ROOT = join(import.meta.dirname, "..");
const BASELINE = join(ROOT, "scripts/svelte-types-baseline.json");

const result = spawnSync(
  join(ROOT, "node_modules/.bin/svelte-check"),
  [
    "--workspace",
    join(ROOT, "src"),
    "--tsconfig",
    join(ROOT, "tsconfig.svelte-types.json"),
    "--diagnostic-sources",
    "js",
    "--output",
    "machine",
  ],
  { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
);
const output = `${result.stdout}\n${result.stderr}`;
if (!/ COMPLETED /.test(output)) {
  console.error(output);
  throw new Error("svelte-check didn't complete");
}

const errors = parseErrors(output);
const current = countByFile(errors);
const total = errors.length;

if (values.update) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(
    `Wrote ${total} errors in ${Object.keys(current).length} components to scripts/svelte-types-baseline.json.`,
  );
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf-8"));
const { regressed, improved } = compare(baseline, current);
const github = Boolean(process.env.GITHUB_ACTIONS);

const describe = ({ file, was, now }: Change) => `  ${file}: ${was} -> ${now}`;

if (regressed.length) {
  // The baseline counts errors per component, so list all of each one's.
  console.error("Components with new type errors (all of their errors):");
  for (const change of regressed) {
    console.error(describe(change));
    for (const error of errors.filter((e) => e.file === change.file)) {
      const where = `src/${error.file}:${error.line}:${error.column}`;
      console.error(`    ${where} ${error.message}`);
      if (github) {
        const message = error.message.replaceAll("\n", "%0A");
        console.log(
          `::error file=src/${error.file},line=${error.line},col=${error.column}::${message}`,
        );
      }
    }
  }
  console.error(
    "\nFix the new errors. The baseline only goes down (see CONTRIBUTING, Component script types).",
  );
}

if (improved.length) {
  console.error("Components with fewer type errors than the baseline:");
  for (const change of improved) console.error(describe(change));
  console.error(
    "\nRun `bun run test:src-svelte-types --update` to lower the baseline.",
  );
}

if (regressed.length || improved.length) process.exit(1);
console.log(
  `${total} type errors in ${Object.keys(current).length} components, matching the baseline.`,
);
