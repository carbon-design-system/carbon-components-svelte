import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
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
  type StyleSeeds,
  stylesheetEntries,
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
 *
 * A `css/` change compiles the stylesheets at the merge base and the working
 * tree to narrow the e2e tests (see `scripts/lib/css-delta.ts`). That needs
 * an install; without one, it runs every test that loads a stylesheet.
 */
// Directories, plus the root-level config a test imports. The framed
// DatePicker pages are examples an e2e test renders from `src`. Adding all of
// `framed/` brings in pages that import docs-only packages.
const GRAPH_ROOTS = [
  "src",
  "tests",
  "e2e",
  "css",
  "scripts",
  "docs/src/pages/framed/DatePicker",
  "crassus.config.ts",
];
/** Where the classes a fixture page renders are spelled. */
const PAGE_SOURCE = /^(?:src|e2e)\//;
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

/** Every file in the graph roots, by path. */
function loadSources(): Map<string, string> {
  const files = lines(
    git("ls-files", "-co", "--exclude-standard", "--", ...GRAPH_ROOTS),
  ).filter((file) => existsSync(join(ROOT, file)));
  return new Map(files.map((file) => [file, read(file)]));
}

/** The dependency graph of the working tree. */
export function loadGraph(sources = loadSources()): Graph {
  const exists = new Set(sources.keys());
  const packages = installedPackages();
  const builtins = new Set(builtinModules);
  return buildGraph(sources, {
    exists: (path) => exists.has(path),
    isExternal: (specifier) =>
      RUNTIME_BUILTIN.test(specifier) ||
      builtins.has(specifier) ||
      packages.has(packageName(specifier)),
    barrel: parseBarrel(read(BARREL)),
  });
}

/** Compiles `entries` from the `css/` tree under `root`. */
async function compileCss(root: string, entries: string[]): Promise<string[]> {
  const { default: config } = await import("../crassus.config");
  if (!config.compile) throw new Error("crassus.config.ts has no compile");
  const sheets = await config.compile(root, { entries });
  return entries.map((entry) => sheets[entry].css);
}

/** The `css/` tree at `rev`, extracted into a temporary directory. */
function checkoutCss(rev: string): string {
  const dir = mkdtempSync(join(tmpdir(), "test-changed-css-"));
  const archive = spawnSync("git", ["archive", rev, "css"], {
    cwd: ROOT,
    maxBuffer: 256 * 1024 * 1024,
  });
  const extract = spawnSync("tar", ["-x", "-C", dir], {
    input: archive.stdout,
  });
  if (archive.status !== 0 || extract.status !== 0) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`couldn't extract css/ at ${rev}`);
  }
  return dir;
}

type Styles = StyleSeeds & { selectors?: string[] };

/** The sources a `css/` change can show up in, from the compiled diff. */
async function styleSeeds(
  mergeBase: string,
  graph: Graph,
  sources: Map<string, string>,
): Promise<Styles> {
  const entries = stylesheetEntries(graph);
  let base: string | undefined;
  try {
    const { changedSelectors, selectorSources } = await import(
      "./lib/css-delta"
    );
    base = checkoutCss(mergeBase);
    const [before, after] = await Promise.all([
      compileCss(base, entries),
      compileCss(ROOT, entries),
    ]);
    const selectors = new Set<string>();
    for (const [i, entry] of entries.entries()) {
      const change = changedSelectors(before[i], after[i]);
      if ("reason" in change) {
        return { reason: `${entry}.css: ${change.reason}` };
      }
      for (const selector of change.selectors) selectors.add(selector);
    }
    const pages = new Map(
      [...sources].filter(([file]) => PAGE_SOURCE.test(file)),
    );
    const seeds = selectorSources(pages, [...selectors]);
    return "reason" in seeds ? seeds : { ...seeds, selectors: [...selectors] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { reason: `couldn't diff the compiled CSS: ${message}` };
  } finally {
    if (base) rmSync(base, { recursive: true, force: true });
  }
}

async function computePlan(
  baseRef: string,
): Promise<{ plan: TestPlan; styles?: Styles }> {
  const mergeBase = git("merge-base", baseRef, "HEAD").trim();
  const baseBarrel = spawnSync("git", ["show", `${mergeBase}:${BARREL}`], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  const barrel = parseBarrel(read(BARREL));
  const sources = loadSources();
  const graph = loadGraph(sources);
  const changed = changedFiles(mergeBase);
  const styles = changed.some((file) => file.startsWith("css/"))
    ? await styleSeeds(mergeBase, graph, sources)
    : undefined;
  const plan = planTests(
    graph,
    changed,
    baseBarrel.status === 0
      ? changedBarrelNames(parseBarrel(baseBarrel.stdout), barrel)
      : [...barrel.keys()],
    styles,
  );
  return { plan, styles };
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
  const { plan, styles } = await computePlan(baseRef);

  if (args.includes("--print")) {
    console.log(JSON.stringify({ ...plan, styles }, null, 2));
    process.exit(0);
  }

  for (const reason of plan.reasons) console.log(`Full run: ${reason}`);
  if (styles && "files" in styles) {
    console.log(
      `CSS: ${styles.selectors?.length} changed selectors, rendered by ${styles.files.length} sources`,
    );
  }
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
