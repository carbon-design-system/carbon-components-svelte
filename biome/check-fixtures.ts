#!/usr/bin/env bun
/**
 * Asserts that every `biome/fixtures/*.{js,svelte}` file produces plugin
 * diagnostics on exactly the lines marked with a trailing `// flag` comment,
 * and no other lines.
 *
 * Usage: `bun biome/check-fixtures.ts`
 */
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
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

  // The root biome.json excludes `biome/fixtures` from `files.includes` so
  // the deliberately-bad naming patterns in the fixtures never trip the real
  // lint run (`bun lint`, `bun lint:changed`, `biome ci`). Biome 2.5.13
  // applies that exclude to explicitly-passed CLI paths too (confirmed
  // directly: `biome lint biome/fixtures` reports "these paths were
  // provided but ignored" even with `--files-ignore-unknown=true`), so
  // there's no CLI flag that un-ignores an explicit target under an
  // excluded directory. The workaround: copy the fixtures to a scratch
  // directory that isn't excluded, then lint that copy with the repo's own
  // root config (no `--config-path` override, no second config file).
  //
  // The scratch directory also has to live under `src/`, not the OS temp
  // directory: the plugins are declared under an `overrides` entry scoped to
  // `"includes": ["src/**"]` (see biome/README.md), not the top-level
  // `plugins` array, so they only fire for paths under `src/`. `--only=plugin`
  // restricts the report to plugin diagnostics only, so the fixtures'
  // deliberately-odd code doesn't also trip unrelated built-in rules
  // (verified: with `--only=plugin`, every diagnostic's `category` is
  // `"plugin"`).
  const scratchDir = mkdtempSync(join(ROOT, "src", "biome-fixture-check-"));

  try {
    cpSync(FIXTURES_DIR, scratchDir, { recursive: true });

    const proc = Bun.spawnSync(
      [
        BIOME_BIN,
        "lint",
        "--config-path",
        join(ROOT, "biome.json"),
        "--only=plugin",
        "--reporter=json",
        scratchDir,
      ],
      { stdout: "pipe", stderr: "pipe" },
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

      // Diagnostic paths come back absolute (the scratch dir target was
      // passed as an absolute path). Map them back to the corresponding
      // file under `biome/fixtures`.
      const absolutePath = join(FIXTURES_DIR, relative(scratchDir, path));

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
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main();
