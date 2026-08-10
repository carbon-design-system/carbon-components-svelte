import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");

const THEME_ENTRIES = [
  "white.scss",
  "g10.scss",
  "g80.scss",
  "g90.scss",
  "g100.scss",
];

// Imported by css/all.scss only: requires the runtime CSS custom properties
// that only all.css enables.
const ALL_ONLY_IMPORTS = ["./ui-shell-classic"];

// Partials imported by other css/_*.scss partials, not by theme entry files.
const UNREGISTERED_PARTIALS = ["_spacing-scale.scss"];

function importsOf(file: string) {
  return readFileSync(join(CSS_DIR, file), "utf8")
    .split("\n")
    .map((line) => line.match(/^@import "(.+)";$/)?.[1])
    .filter((specifier): specifier is string => Boolean(specifier));
}

describe("theme entry files", () => {
  it("imports are identical across the five theme entries", () => {
    const [white, ...rest] = THEME_ENTRIES.map(importsOf);
    for (const [i, entry] of rest.entries()) {
      expect(entry, THEME_ENTRIES[i + 1]).toEqual(white);
    }
  });

  it("all.scss imports match the theme entries plus all-only partials", () => {
    const all = importsOf("all.scss").filter(
      (specifier) => !ALL_ONLY_IMPORTS.includes(specifier),
    );
    expect(all).toEqual(importsOf("white.scss"));
  });

  it("every local import resolves to a css partial", () => {
    const locals = new Set(
      ["all.scss", ...THEME_ENTRIES]
        .flatMap(importsOf)
        .filter((specifier) => specifier.startsWith("./")),
    );
    for (const specifier of locals) {
      expect(
        existsSync(join(CSS_DIR, `_${specifier.slice(2)}.scss`)),
        specifier,
      ).toBe(true);
    }
  });

  it("every carbon-components import resolves to the vendored tree", () => {
    const specifiers = new Set(
      readdirSync(CSS_DIR)
        .filter((file) => file.endsWith(".scss"))
        .flatMap(importsOf)
        .filter((specifier) => specifier.startsWith("carbon-components/")),
    );
    // Sass import resolution against the build's `loadPaths: ["css/vendor"]`.
    const resolves = (specifier: string) => {
      const path = join(CSS_DIR, "vendor", specifier);
      const dir = join(path, "..");
      const base = path.slice(dir.length + 1);
      return [
        // Legacy `@import` prefers the `.import.scss` variant when present.
        join(dir, `${base}.import.scss`),
        join(dir, `_${base}.import.scss`),
        join(dir, `${base}.scss`),
        join(dir, `_${base}.scss`),
        join(path, "index.scss"),
        join(path, "_index.scss"),
      ].some(existsSync);
    };
    for (const specifier of specifiers) {
      expect(resolves(specifier), specifier).toBe(true);
    }
  });

  it("every css partial is registered in a theme entry file", () => {
    const registered = new Set(
      ["all.scss", ...THEME_ENTRIES]
        .flatMap(importsOf)
        .filter((specifier) => specifier.startsWith("./"))
        .map((specifier) => `_${specifier.slice(2)}.scss`),
    );
    const partials = readdirSync(CSS_DIR).filter(
      (file) =>
        file.startsWith("_") &&
        file.endsWith(".scss") &&
        !UNREGISTERED_PARTIALS.includes(file),
    );
    for (const partial of partials) {
      expect(registered.has(partial), partial).toBe(true);
    }
  });
});
