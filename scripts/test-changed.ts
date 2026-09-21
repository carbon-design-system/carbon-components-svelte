import { spawnSync } from "node:child_process";

/**
 * `vitest --changed` walks Vite's module graph, which doesn't reliably
 * resolve through .svelte SFCs in this repo — it falls back to running the
 * full suite even for a single-component diff. `src/<Component>/` and
 * `tests/<Component>/` are 1:1 by directory name, so map the git diff to
 * component dirs directly instead.
 */
const WIDE_TRIGGER_PATTERNS = [
  /^src\/[^/]+$/, // top-level src file, e.g. src/index.js (barrel)
  /^tests\/[^/]+$/, // top-level tests file, e.g. setup-tests.ts, utils.ts
  /^src\/utils\//, // shared utils consumed across many components
];

const COMPONENT_DIR_PATTERN = /^(?:src|tests)\/([^/]+)\//;

export type Classification =
  | { mode: "skip" }
  | { mode: "full" }
  | { mode: "scoped"; dirs: string[] };

export function classifyChanges(files: string[]): Classification {
  if (files.length === 0) return { mode: "skip" };

  const needsFullRun = files.some(
    (file) =>
      !(file.startsWith("src/") || file.startsWith("tests/")) ||
      WIDE_TRIGGER_PATTERNS.some((pattern) => pattern.test(file)),
  );
  if (needsFullRun) return { mode: "full" };

  const dirs = new Set<string>();
  for (const file of files) {
    const match = file.match(COMPONENT_DIR_PATTERN);
    if (match) dirs.add(match[1]);
  }
  return dirs.size === 0
    ? { mode: "skip" }
    : { mode: "scoped", dirs: [...dirs] };
}

function changedFiles(baseRef: string): string[] {
  const result = spawnSync("git", ["diff", "--name-only", baseRef], {
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git diff against ${baseRef} failed`);
  }
  return result.stdout.split("\n").filter(Boolean);
}

function runVitest(args: string[]): never {
  const result = spawnSync("bunx", ["vitest", "run", ...args], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

if (import.meta.main) {
  const baseRef = process.argv[2] ?? "origin/master";
  const classification = classifyChanges(changedFiles(baseRef));

  switch (classification.mode) {
    case "skip":
      console.log(
        `No test-relevant changes against ${baseRef}; skipping tests.`,
      );
      break;
    case "full":
      console.log("Changes affect shared files; running the full suite.");
      runVitest([]);
      break;
    case "scoped":
      console.log(`Running tests for: ${classification.dirs.join(", ")}`);
      runVitest(classification.dirs);
      break;
  }
}
