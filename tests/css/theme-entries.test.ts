import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");
const MANIFEST = "_carbon-styles.scss";

const THEME_ENTRIES = [
  "white.scss",
  "g10.scss",
  "g80.scss",
  "g90.scss",
  "g100.scss",
];

// all.scss needs the component token maps before its `:root` theme blocks;
// these imports define variables only and emit no CSS.
const ALL_ONLY_IMPORTS = [
  "carbon-components/scss/globals/scss/component-tokens",
  "carbon-components/scss/components/tag/tokens",
  "carbon-components/scss/components/notification/tokens",
];

// Partials imported by other css/_*.scss partials, not by the manifest.
const UNREGISTERED_PARTIALS = ["_spacing-scale.scss", MANIFEST];

function importsOf(file: string) {
  return readFileSync(join(CSS_DIR, file), "utf8")
    .split("\n")
    .map((line) => line.match(/^@import "(.+)";$/)?.[1])
    .filter((specifier): specifier is string => Boolean(specifier));
}

const localImports = (file: string) =>
  importsOf(file).filter((specifier) => specifier.startsWith("./"));

describe("theme entry files", () => {
  it("every theme entry imports only the shared manifest locally", () => {
    for (const entry of [...THEME_ENTRIES, "all.scss"]) {
      expect(localImports(entry), entry).toEqual(["./carbon-styles"]);
    }
  });

  it("imports are identical across the five theme entries", () => {
    const [white, ...rest] = THEME_ENTRIES.map(importsOf);
    for (const [i, entry] of rest.entries()) {
      expect(entry, THEME_ENTRIES[i + 1]).toEqual(white);
    }
  });

  it("all.scss adds only token-map imports over a theme entry", () => {
    const all = importsOf("all.scss").filter(
      (specifier) => !ALL_ONLY_IMPORTS.includes(specifier),
    );
    expect(all).toEqual(importsOf("white.scss"));
  });

  it("all.scss alone enables the theme-switching guard", () => {
    const flag = /^\$ccs-theme-switching: true;$/m;
    expect(readFileSync(join(CSS_DIR, "all.scss"), "utf8")).toMatch(flag);
    for (const entry of THEME_ENTRIES) {
      expect(readFileSync(join(CSS_DIR, entry), "utf8"), entry).not.toMatch(
        flag,
      );
    }
  });

  it("every local import resolves to a css partial", () => {
    const locals = new Set(
      ["all.scss", MANIFEST, ...THEME_ENTRIES].flatMap(localImports),
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

  it("every css partial is registered in the manifest exactly once", () => {
    const registered = localImports(MANIFEST).map(
      (specifier) => `_${specifier.slice(2)}.scss`,
    );
    expect(new Set(registered).size, "duplicate manifest import").toBe(
      registered.length,
    );
    const partials = readdirSync(CSS_DIR).filter(
      (file) =>
        file.startsWith("_") &&
        file.endsWith(".scss") &&
        !UNREGISTERED_PARTIALS.includes(file),
    );
    for (const partial of partials) {
      expect(registered.includes(partial), partial).toBe(true);
    }
  });

  it("tag emits before the components that restyle it", () => {
    const order = importsOf(MANIFEST);
    const at = (specifier: string) => order.indexOf(specifier);
    const tag = at("carbon-components/scss/components/tag/tag");
    expect(tag).toBeGreaterThan(-1);
    for (const later of [
      "carbon-components/scss/components/list-box/list-box",
      "carbon-components/scss/components/multi-select/multi-select",
      "./contained-list",
    ]) {
      expect(at(later), later).toBeGreaterThan(tag);
    }
  });
});
