import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { PAGE_EXTENSION } from "./constants.ts";

const PAGES_DIR = path.join(import.meta.dir, "../src/pages");

// The router and the Svelte config compile only these. A page with any
// other extension, such as `.svx`, builds without error and has no route.
const COMPILED = [".svelte", PAGE_EXTENSION];

test("every page under src/pages has an extension the site compiles", () => {
  const skipped = fs
    .readdirSync(PAGES_DIR, { recursive: true, withFileTypes: true })
    // Dotfiles, such as Finder's `.DS_Store`, aren't pages.
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) =>
      path.relative(PAGES_DIR, path.join(entry.parentPath, entry.name)),
    )
    .filter((file) => !COMPILED.includes(path.extname(file)));

  expect(skipped).toEqual([]);
});
