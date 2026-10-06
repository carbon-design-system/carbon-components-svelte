import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join } from "node:path";
import {
  BARREL,
  buildGraph,
  changedBarrelNames,
  formatSelection,
  type Graph,
  parseBarrel,
  planTests,
  type Selection,
  type TestPlan,
} from "./lib/test-graph";

/**
 * Runs only the tests a diff can affect, picked from a static dependency
 * graph (see `scripts/lib/test-graph.ts`). Zero dependencies and no install
 * needed, so CI computes the selection once in a cheap job.
 *
 *   bun scripts/test-changed.ts [base]                   # run affected unit tests
 *   bun scripts/test-changed.ts [base] --print           # print the plan as JSON
 *   bun scripts/test-changed.ts [base] --github-output   # write unit-tests/e2e-tests outputs
 *
 * Each output is `all`, `none`, or a space-separated list of test files.
 */
const GRAPH_ROOTS = ["src", "tests", "e2e", "css", "scripts"];
const RUNTIME_BUILTIN = /^(?:node:|bun(?:$|:))/;
const LOCKFILE_PACKAGE = /^\s+"([^"]+)": \["\1@/gm;
const ROOT = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
}).stdout.trim();

function read(file: string): string {
  return readFileSync(join(ROOT, file), "utf-8");
}

function git(...args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout;
}

function lines(output: string): string[] {
  return output.split("\n").filter(Boolean);
}

/** Committed, staged, unstaged, and untracked changes since the merge base. */
function changedFiles(mergeBase: string): string[] {
  return [
    ...new Set([
      ...lines(git("diff", "--name-only", "--no-renames", mergeBase)),
      ...lines(git("ls-files", "--others", "--exclude-standard")),
    ]),
  ];
}

/** Package names the lockfile installs, read without `node_modules`. */
function installedPackages(): Set<string> {
  const names = new Set<string>();
  for (const lockfile of [
    "bun.lock",
    "tests-svelte3/bun.lock",
    "tests-svelte4/bun.lock",
  ]) {
    if (!existsSync(join(ROOT, lockfile))) continue;
    for (const [, name] of read(lockfile).matchAll(LOCKFILE_PACKAGE)) {
      names.add(name);
    }
  }
  return names;
}

function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** The dependency graph of the working tree. */
export function loadGraph(): Graph {
  const files = lines(
    git("ls-files", "-co", "--exclude-standard", "--", ...GRAPH_ROOTS),
  ).filter((file) => existsSync(join(ROOT, file)));
  const exists = new Set(files);
  const packages = installedPackages();
  const builtins = new Set(builtinModules);
  return buildGraph(new Map(files.map((file) => [file, read(file)])), {
    exists: (path) => exists.has(path),
    isExternal: (specifier) =>
      RUNTIME_BUILTIN.test(specifier) ||
      builtins.has(specifier) ||
      packages.has(packageName(specifier)),
    barrel: parseBarrel(read(BARREL)),
  });
}

function computePlan(baseRef: string): TestPlan {
  const mergeBase = git("merge-base", baseRef, "HEAD").trim();
  const baseBarrel = spawnSync("git", ["show", `${mergeBase}:${BARREL}`], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  const barrel = parseBarrel(read(BARREL));
  return planTests(
    loadGraph(),
    changedFiles(mergeBase),
    baseBarrel.status === 0
      ? changedBarrelNames(parseBarrel(baseBarrel.stdout), barrel)
      : [...barrel.keys()],
  );
}

function logSelection(label: string, selection: Selection) {
  const count =
    selection.mode === "some"
      ? `${selection.files.length} files`
      : selection.mode;
  console.log(`${label}: ${count}`);
  if (selection.mode === "some") {
    for (const file of selection.files) console.log(`  ${file}`);
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const baseRef = args.find((arg) => !arg.startsWith("--")) ?? "origin/master";
  const plan = computePlan(baseRef);

  if (args.includes("--print")) {
    console.log(JSON.stringify(plan, null, 2));
    process.exit(0);
  }

  for (const reason of plan.reasons) console.log(`Full run: ${reason}`);
  logSelection("Unit tests", plan.unit);
  logSelection("E2E tests", plan.e2e);

  if (args.includes("--github-output")) {
    const output = process.env.GITHUB_OUTPUT;
    if (!output) throw new Error("GITHUB_OUTPUT is not set");
    appendFileSync(
      output,
      `unit-tests=${formatSelection(plan.unit)}\ne2e-tests=${formatSelection(plan.e2e)}\n`,
    );
    process.exit(0);
  }

  if (plan.unit.mode === "none") {
    console.log(`No unit tests affected against ${baseRef}; skipping.`);
    process.exit(0);
  }
  const files = plan.unit.mode === "some" ? plan.unit.files : [];
  const result = spawnSync("bunx", ["vitest", "run", ...files], {
    cwd: ROOT,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}
