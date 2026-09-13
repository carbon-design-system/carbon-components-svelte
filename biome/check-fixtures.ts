#!/usr/bin/env bun
/**
 * Asserts that every `biome/fixtures/*.{js,svelte}` file produces plugin
 * diagnostics on exactly the lines marked with a trailing `// flag` comment,
 * and no other lines.
 *
 * Usage: `bun biome/check-fixtures.ts`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const BIOME_DIR = import.meta.dirname;
const FIXTURES_DIR = join(BIOME_DIR, "fixtures");
const BIOME_BIN = join(ROOT, "node_modules", ".bin", "biome");
const FLAG_COMMENT = /\/\/\s*flag\s*$/;

function listFixtureFiles(dir: string): string[] {
  let entries: string[];

  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      files.push(...listFixtureFiles(full));
    } else if (full.endsWith(".js") || full.endsWith(".svelte")) {
      files.push(full);
    }
  }

  return files;
}

function getExpectedLines(path: string): Set<number> {
  const content = readFileSync(path, "utf-8");
  const lines = content.split("\n");
  const expected = new Set<number>();

  lines.forEach((line, index) => {
    if (FLAG_COMMENT.test(line)) {
      expected.add(index + 1);
    }
  });

  return expected;
}

interface Diagnostic {
  severity: string;
  message: string;
  location?: { path?: string; start?: { line: number } };
}

interface LintReport {
  diagnostics: Diagnostic[];
}

function main() {
  const fixtureFiles = listFixtureFiles(FIXTURES_DIR);

  if (fixtureFiles.length === 0) {
    console.log("biome/check-fixtures: no fixtures found; nothing to check.");
    return;
  }

  // Biome 2.5.13 reports a spurious "nested root configuration" error when
  // the lint target is a descendant of the directory holding the config
  // file passed via --config-path, while the invocation's cwd is an
  // ancestor that also has its own (unrelated) root biome.json — which is
  // exactly the shape of `<repo root>/biome/{biome.json,fixtures/}`.
  // Running with cwd set to `biome/` itself, using paths relative to that
  // cwd, avoids the bug (see biome/README.md).
  const proc = Bun.spawnSync(
    [
      BIOME_BIN,
      "lint",
      "--config-path=lint-style.json",
      "--reporter=json",
      "fixtures",
    ],
    { cwd: BIOME_DIR, stdout: "pipe", stderr: "pipe" },
  );

  const stdout = proc.stdout.toString("utf-8");
  let report: LintReport;

  try {
    report = JSON.parse(stdout);
  } catch {
    console.error("biome/check-fixtures: could not parse biome JSON output.");
    console.error("--- stdout ---");
    console.error(stdout);
    console.error("--- stderr ---");
    console.error(proc.stderr.toString("utf-8"));
    process.exit(1);
  }

  const actualByFile = new Map<string, Set<number>>();

  for (const diagnostic of report.diagnostics) {
    const path = diagnostic.location?.path;
    const line = diagnostic.location?.start?.line;

    if (!path || line === undefined) continue;

    // Diagnostic paths are relative to BIOME_DIR (e.g. "fixtures/a.js").
    const absolutePath = join(BIOME_DIR, path);

    if (!actualByFile.has(absolutePath))
      actualByFile.set(absolutePath, new Set());
    actualByFile.get(absolutePath)?.add(line);
  }

  let hasMismatch = false;

  for (const fixtureFile of fixtureFiles) {
    const expected = getExpectedLines(fixtureFile);
    const actual = actualByFile.get(fixtureFile) ?? new Set<number>();

    const missing = [...expected]
      .filter((line) => !actual.has(line))
      .sort((a, b) => a - b);
    const unexpected = [...actual]
      .filter((line) => !expected.has(line))
      .sort((a, b) => a - b);

    if (missing.length > 0 || unexpected.length > 0) {
      hasMismatch = true;
      console.error(`biome/check-fixtures: ${relative(ROOT, fixtureFile)}`);

      if (missing.length > 0) {
        console.error(
          `  expected diagnostics on lines [${missing.join(", ")}] but got none`,
        );
      }

      if (unexpected.length > 0) {
        console.error(
          `  unexpected diagnostics on lines [${unexpected.join(", ")}]`,
        );
      }
    }
  }

  if (hasMismatch) {
    console.error("biome/check-fixtures: FAILED");
    process.exit(1);
  }

  console.log(
    `biome/check-fixtures: OK (${fixtureFiles.length} fixture file${fixtureFiles.length === 1 ? "" : "s"})`,
  );
}

main();
