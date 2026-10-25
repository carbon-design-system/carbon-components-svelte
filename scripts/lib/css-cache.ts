// Reads only the cache directory its caller passes.
// @reads node_modules/.cache/test-changed-css/**
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

/** Compiles kept on disk; the least recently used go first. */
export const KEEP = 16;

/** A cache key from everything a compile depends on. */
export function compileKey(parts: string[]): string {
  const hash = createHash("sha1");
  for (const part of parts) hash.update(part).update("\0");
  return hash.digest("hex");
}

/**
 * `compile()`'s stylesheets, read back from `dir` when `key` was compiled
 * before. An `undefined` key always compiles.
 */
export async function cachedSheets(
  dir: string,
  key: string | undefined,
  compile: () => Promise<string[]>,
): Promise<string[]> {
  if (key === undefined) return compile();
  const file = join(dir, `${key}.json`);
  if (existsSync(file)) {
    try {
      const sheets = JSON.parse(readFileSync(file, "utf-8"));
      const now = new Date();
      utimesSync(file, now, now);
      return sheets;
    } catch {
      // A partial or corrupt entry compiles again.
    }
  }
  const sheets = await compile();
  mkdirSync(dir, { recursive: true });
  const partial = `${file}.${process.pid}.tmp`;
  writeFileSync(partial, JSON.stringify(sheets));
  renameSync(partial, file);
  prune(dir);
  return sheets;
}

function prune(dir: string) {
  const entries = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, used: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.used - a.used);
  for (const { name } of entries.slice(KEEP)) {
    rmSync(join(dir, name), { force: true });
  }
}
