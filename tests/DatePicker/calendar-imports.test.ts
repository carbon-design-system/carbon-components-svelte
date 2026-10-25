// @vitest-environment node
// @depends-on src/DatePicker/** src/utils/**
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const IMPORT = /^\s*(?:import|export)\b[^"'`;]*?from\s+["']([^"']+)["']/gm;

/** Every bare specifier the module imports, following relative imports. */
function bareImports(file: string, seen = new Set<string>()): string[] {
  if (seen.has(file)) return [];
  seen.add(file);
  const found: string[] = [];
  for (const [, specifier] of readFileSync(file, "utf8").matchAll(IMPORT)) {
    if (specifier.startsWith(".")) {
      found.push(...bareImports(resolve(dirname(file), specifier), seen));
    } else {
      found.push(specifier);
    }
  }
  return found;
}

describe("calendar engine imports", () => {
  it("pulls in no Svelte, so it stays plain DOM code", () => {
    const engine = resolve(__dirname, "../../src/DatePicker/calendar.js");

    expect(
      bareImports(engine).filter(
        (specifier) =>
          specifier === "svelte" || specifier.startsWith("svelte/"),
      ),
    ).toEqual([]);
  });
});
