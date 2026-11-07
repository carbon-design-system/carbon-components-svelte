// vitest environment: `environment: "<path>/dom-env/vitest.js"` with
// `pool: "vmThreads"`. Builds the per-file context the way vitest's own
// `node` environment does, then evaluates the DOM bundle inside it.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { builtinEnvironments } from "vitest/runtime";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(here, "dist/dom-env.js");
const srcDir = path.join(here, "src");

/**
 * Rebuilds the bundle when any source file is newer (dev convenience).
 * Workers start in parallel, so each builds to its own temp file and
 * renames it into place; readers never see a half-written bundle.
 */
function ensureBundle() {
  const built = fs.existsSync(bundle) ? fs.statSync(bundle).mtimeMs : 0;
  const stale = fs
    .readdirSync(srcDir)
    .some((f) => fs.statSync(path.join(srcDir, f)).mtimeMs > built);
  if (!stale) return;
  // Workers are threads of one process, so the pid alone isn't unique.
  const tmp = `${bundle}.${randomUUID()}.tmp`;
  execFileSync(
    "bun",
    [
      "build",
      "src/index.js",
      "--format=iife",
      "--target=browser",
      `--outfile=${tmp}`,
    ],
    { cwd: here, stdio: "ignore" },
  );
  fs.renameSync(tmp, bundle);
}

let script = null;
function getScript() {
  if (script) return script;
  ensureBundle();
  // One compiled Script per worker, run in each file's fresh context.
  script = new vm.Script(fs.readFileSync(bundle, "utf8"), { filename: bundle });
  return script;
}

/**
 * Strict mode (`domEnv: { strict: "warn" | "error" }`, or `DOM_ENV_STRICT`)
 * lists what a test file reached for that dom-env doesn't implement: members
 * read, written or probed with `in`, and CSS property names. "warn" prints
 * the list; "error" fails the file's teardown with it.
 */
function reportGaps(gaps, mode) {
  const lines = gaps.map(
    ({ kind, name, count, at }) =>
      `  ${kind} ${name}${count > 1 ? ` (x${count})` : ""}${at ? ` at ${at}` : ""}`,
  );
  const text = `dom-env strict: ${gaps.length} gap(s)\n${lines.join("\n")}`;
  if (mode === "error") throw new Error(text);
  process.stderr.write(`${text}\n`);
}

export default {
  name: "dom-env",
  viteEnvironment: "client",
  async setupVM(options) {
    const nodeEnv = await builtinEnvironments.node.setupVM(options);
    const context = nodeEnv.getVmContext();
    getScript().runInContext(context);
    const global = vm.runInContext("this", context);
    const strict = options?.domEnv?.strict ?? process.env.DOM_ENV_STRICT;
    const leaks = options?.domEnv?.leaks ?? process.env.DOM_ENV_LEAKS;
    const checks = options?.domEnv?.checks ?? process.env.DOM_ENV_CHECKS;
    global.__domEnv.install({
      url: options?.domEnv?.url,
      strict,
      leaks,
      checks,
    });
    global.__domEnvUncaught = (error) =>
      process.emit("uncaughtException", error);
    return {
      getVmContext: () => context,
      teardown: () => {
        const gaps = strict ? global.__domEnv.gaps() : [];
        nodeEnv.teardown();
        if (gaps.length) reportGaps(gaps, strict);
      },
    };
  },
  setup() {
    throw new Error(
      "dom-env runs only in vitest's vmThreads pool (pool: 'vmThreads').",
    );
  },
};
