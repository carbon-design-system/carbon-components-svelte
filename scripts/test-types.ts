import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Type-checks `tests/` with `svelte-check --tsgo --incremental`.
 *
 *   bun run test:types
 *
 * The cache in `tests/.svelte-check` reuses a transpiled file while its
 * source keeps the same mtime and size, whichever svelte2tsx or Svelte
 * produced it. Clear it when either version changes, so a bump can't check
 * stale output. tsgo's own `tsbuildinfo.json` tracks its version itself.
 */
const ROOT = join(import.meta.dirname, "..");
const CACHE = join(ROOT, "tests/.svelte-check");
const KEY_FILE = join(CACHE, "versions.json");

const version = (pkg: string) =>
  JSON.parse(
    readFileSync(join(ROOT, "node_modules", pkg, "package.json"), "utf-8"),
  ).version as string;

const key = JSON.stringify({
  "svelte-check": version("svelte-check"),
  svelte: version("svelte"),
});

let cached: string | undefined;
try {
  cached = readFileSync(KEY_FILE, "utf-8");
} catch {}

if (cached !== key) {
  rmSync(CACHE, { recursive: true, force: true });
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(KEY_FILE, key);
}

const result = spawnSync(
  join(ROOT, "node_modules/.bin/svelte-check"),
  [
    "--workspace",
    join(ROOT, "tests"),
    "--tsgo",
    "--incremental",
    "--fail-on-warnings",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
