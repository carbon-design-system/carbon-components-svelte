// @vitest-environment node
// @depends-on src/**
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SRC = join(__dirname, "../../src");

/** Every module `entry` reaches through relative static imports. */
function reachable(entry: string) {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const code = readFileSync(file, "utf8");
    for (const [, spec] of code.matchAll(
      /\bimport\s[^"']*?["'](\.[^"']+)["']/g,
    )) {
      visit(resolve(dirname(file), spec));
    }
  };
  visit(join(SRC, entry));
  return [...seen].map((file) => file.slice(SRC.length + 1));
}

// These render a spinner without the overlay, so the overlay's focus trap
// and Loading's delay timer should stay out of their bundles.
it.each([
  "Button/Button.svelte",
  "Search/Search.svelte",
  "InlineLoading/InlineLoading.svelte",
  "FileUploader/Filename.svelte",
])("%s doesn't reach Loading or its focus trap", (entry) => {
  const modules = reachable(entry);
  expect(modules).toContain("Loading/LoadingSpinner.svelte");
  expect(modules).not.toContain("Loading/Loading.svelte");
  expect(modules).not.toContain("Loading/overlay-focus.js");
});
