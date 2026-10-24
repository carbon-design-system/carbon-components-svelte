// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";
import { contrast, THEMES, themeTokens } from "./helpers";

const GUARD =
  /:where\(:not\(\[class\*="?bx--"?\]\):not\(\.bx--prose \[class\*="?bx--"?\]:not\(\.bx--prose\) \*\)\)/;

// Numbered layer and border tokens stay on one surface however deep the
// Layer; Prose's surfaces read the contextual names.
const NUMBERED = /^(layer|field|border-(subtle|strong|tile))[a-z-]*-0[0-3]$/;

// Link's v11 hooks, which nothing declares.
const LINK_HOOKS = [
  "link-text-color",
  "link-hover-text-color",
  "link-focus-text-color",
];

const tokens = (css: string, pattern: RegExp) =>
  new Set([...css.matchAll(pattern)].map(([, name]) => name));

describe("prose", () => {
  it("ships in prose.css, not in the theme sheets", async () => {
    const [all, white, prose] = await Promise.all(
      ["all.scss", "white.scss", "prose.scss"].map(compileEntry),
    );
    expect(all).not.toContain("bx--prose");
    expect(white).not.toContain("bx--prose");
    expect(prose).toContain(".bx--prose");
    // No reset or global type of its own: the theme sheet emits those. The
    // one root rule sets a page with no theme to light, for light-dark().
    expect(
      parseRules(prose)
        .filter((r) => !r.selector.includes("bx--prose"))
        .map((r) => [r.selector, Object.fromEntries(r.decls)]),
    ).toEqual([[":where(:root)", { "color-scheme": "light" }]]);
  }, 30_000);

  it("reads only tokens all.css declares, by their contextual names", async () => {
    const [all, prose] = await Promise.all(
      ["all.scss", "prose.scss"].map(compileEntry),
    );
    const declared = tokens(all, /--cds-([\w-]+)\s*:/g);
    const read = tokens(prose, /var\(\s*--cds-([\w-]+)/g);

    expect(read.size).toBeGreaterThan(40);
    expect(
      [...read].filter(
        (name) => !declared.has(name) && !LINK_HOOKS.includes(name),
      ),
    ).toEqual([]);
    expect([...read].filter((name) => NUMBERED.test(name))).toEqual([]);
    expect(LINK_HOOKS.filter((name) => !read.has(name))).toEqual([]);
  }, 30_000);

  it("compiles each static theme's values into prose-<theme>.css", async () => {
    const surface = async (entry: string) =>
      parseRules(await compileEntry(entry))
        .find((r) => /^\.bx--prose pre:where/.test(r.selector))
        ?.decls.get("background-color");

    expect(await surface("prose-white.scss")).toMatch(
      /^var\(--ccs-prose-code-background,\s*var\(--cds-layer,\s*#f4f4f4\)\)$/,
    );
    expect(await surface("prose-g100.scss")).toMatch(
      /^var\(--ccs-prose-code-background,\s*var\(--cds-layer,\s*#262626\)\)$/,
    );
  }, 30_000);

  it("paints alerts with the contextual layer in dark themes", async () => {
    const note = async (entry: string) =>
      parseRules(await compileEntry(entry))
        .find((r) => /\[data-alert=["']?note["']?\]$/.test(r.selector))
        ?.decls.get("background-color");

    // prose.css follows every theme; light-dark() reads the color scheme
    // the theme root or zone sets.
    expect(await note("prose.scss")).toMatch(
      /^light-dark\(var\(--cds-notification-background-info\),\s*var\(--cds-layer\)\)$/,
    );
    expect(await note("prose-white.scss")).toBe("#edf5ff");
    expect(await note("prose-g100.scss")).toMatch(
      /^var\(--cds-layer,\s*#262626\)$/,
    );
  }, 30_000);

  it("steps code in an alert up from the alert's surface", async () => {
    const [{ themes }, prose] = await Promise.all([
      themeTokens(),
      compileEntry("prose.scss"),
    ]);
    const rules = parseRules(prose);
    const decl = (selector: RegExp, property: string) =>
      rules
        .find((r) => selector.test(r.selector) && r.decls.has(property))
        ?.decls.get(property);

    expect(
      decl(
        /^\.bx--prose blockquote:where\(.+\)\[data-alert\]$/,
        "--ccs-prose-code-background",
      ),
    ).toMatch(/^var\(--cds-layer-accent\)$/);
    expect(decl(/^\.bx--prose code:where/, "background-color")).toMatch(
      /^var\(--ccs-prose-code-background,\s*var\(--cds-field\)\)$/,
    );
    expect(decl(/^\.bx--prose pre:where/, "background-color")).toMatch(
      /^var\(--ccs-prose-code-background,\s*var\(--cds-layer\)\)$/,
    );

    // Each alert kind's surface, on the page and on a Layer, against the
    // layer accent at that level. Dark themes paint alerts with the layer
    // at that level.
    for (const theme of THEMES) {
      const t = themes[theme];
      for (const level of ["01", "02"]) {
        const layer = t[`--cds-layer-${level}`];
        const code = t[`--cds-layer-accent-${level}`];
        const surfaces = ["info", "success", "warning", "error"]
          .map((kind) => t[`--cds-notification-background-${kind}`])
          .map((value) => (/^var\(--cds-layer\)$/.test(value) ? layer : value))
          .concat(layer);

        for (const surface of surfaces) {
          expect(
            contrast(code, surface),
            `${theme} layer ${level}: ${code} on ${surface}`,
          ).toBeGreaterThanOrEqual(1.15);
        }
      }
      expect(
        contrast(t["--cds-text-primary"], t["--cds-layer-accent-01"]),
        theme,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }, 30_000);

  it("counts Text as copy, not as a block component, whatever its tag", async () => {
    const afterComponent = parseRules(await compileEntry("prose.scss")).filter(
      (r) =>
        r.selector.startsWith(".bx--prose>:where([") &&
        r.decls.get("margin-block-start") ===
          "var(--ccs-prose-after-component)",
    );

    expect(afterComponent).toHaveLength(1);
    expect(afterComponent[0].selector).toMatch(
      /:not\(\[class\*="?bx--type-"?\]\)/,
    );
  }, 30_000);

  it("guards every element rule against Carbon elements and their descendants, at zero specificity", async () => {
    const selectors = parseRules(await compileEntry("prose.scss"))
      .map((r) => r.selector)
      .filter((s) => s.includes("bx--prose"));
    const elementRules = selectors.filter(
      (s) =>
        // The root, its variants, and the root's rhythm rules space every
        // child, components included.
        !/^\.bx--prose(--[\w-]+)?$/.test(s) &&
        !/^\.bx--prose>(\*\+\*|\*\+(h\d|section|article)|h\d\+\*|h\d\+h\d)$/.test(
          s,
        ) &&
        // The flow container spaces Prose roots and components, not content.
        !s.startsWith(".bx--prose-flow") &&
        // Copy after a component: a rhythm rule between the root's children.
        !s.startsWith(".bx--prose>:where(") &&
        // Prose's own classes, such as the heading anchor.
        !s.includes("bx--prose__"),
    );

    expect(elementRules.length).toBeGreaterThan(20);
    for (const selector of elementRules) {
      expect(selector, selector).toMatch(GUARD);
    }
  }, 30_000);
});
