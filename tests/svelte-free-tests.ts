/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const IMPORT_RE = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
const EXTENSIONS = ["", ".ts", ".js", "/index.ts", "/index.js"];

function resolveLocal(spec: string, fromFile: string, srcDir: string) {
  let base: string;
  if (spec.startsWith("carbon-components-svelte")) {
    base = path.join(srcDir, spec.slice("carbon-components-svelte".length));
  } else if (spec.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null;
  }
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function importsSvelte(
  file: string,
  srcDir: string,
  memo: Map<string, boolean>,
  visiting: Set<string>,
): boolean {
  const cached = memo.get(file);
  if (cached !== undefined) return cached;
  if (visiting.has(file)) return false;
  visiting.add(file);
  let result = false;
  for (const [, spec] of readFileSync(file, "utf8").matchAll(IMPORT_RE)) {
    if (
      spec === "svelte" ||
      spec.startsWith("svelte/") ||
      spec.endsWith(".svelte") ||
      spec.startsWith("@testing-library/svelte")
    ) {
      result = true;
      break;
    }
    const local = resolveLocal(spec, file, srcDir);
    if (local && importsSvelte(local, srcDir, memo, visiting)) {
      result = true;
      break;
    }
  }
  visiting.delete(file);
  memo.set(file, result);
  return result;
}

function listTests(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTests(full));
    else if (entry.name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

/**
 * Test files under `testsDir` that never import Svelte, directly or through
 * the modules they import. Their results can't differ between Svelte
 * versions, so the Svelte 3/4 harnesses skip them.
 */
export function svelteFreeTests(testsDir: string, srcDir: string): string[] {
  const memo = new Map<string, boolean>();
  return listTests(testsDir).filter(
    (file) => !importsSvelte(file, srcDir, memo, new Set()),
  );
}
