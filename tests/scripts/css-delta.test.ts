// @vitest-environment node
import {
  changedSelectors,
  otherAtRules,
  requiredClasses,
  selectorSources,
} from "../../scripts/lib/css-delta";

const BASE = `
@font-face { font-family: "Plex"; src: url("a.woff2"); }
:root { --cds-layer-01: #fff; }
.bx--btn { color: red; }
.bx--tag { color: blue; }
@media (min-width: 42rem) { .bx--tag--sm { height: 1rem; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
`;

describe("requiredClasses", () => {
  it("lists each class a match must have, outside :not()", () => {
    expect(requiredClasses(".a > .b.c::before")).toEqual([["a"], ["b"], ["c"]]);
    expect(requiredClasses("div:not(.a) .b")).toEqual([["b"]]);
    expect(requiredClasses(".bx--col-lg-1\\.5")).toEqual([["bx--col-lg-1.5"]]);
  });

  it("requires one of an :is()/:where()/:has() group's classes", () => {
    expect(requiredClasses(":is(.a, .b .c) span")).toEqual([["a", "b"]]);
    expect(requiredClasses("div:has(.a)")).toEqual([["a"]]);
    expect(requiredClasses(":is(.a, div) .b")).toEqual([["b"]]);
  });

  it("is empty when a match needs no class", () => {
    for (const selector of [
      ":root",
      "body",
      "div:not(.a)",
      ":is(.a, div)",
      '[data-x=".a"]',
      ":nth-child(2 of .a)",
    ]) {
      expect(requiredClasses(selector)).toEqual([]);
    }
  });
});

describe("otherAtRules", () => {
  it("collects at-rules that aren't style rules or their groups", () => {
    expect(otherAtRules(`@import "x.css";\n${BASE}`)).toEqual([
      '@font-face { font-family: "Plex"; src: url("a.woff2"); }',
      '@import "x.css";',
    ]);
  });
});

describe("changedSelectors", () => {
  it("returns the selectors of added, removed, and changed rules", () => {
    const head = BASE.replace("height: 1rem", "height: 2rem").replace(
      ".bx--btn { color: red; }",
      "",
    );
    expect(changedSelectors(BASE, head)).toEqual({
      selectors: [".bx--btn", ".bx--tag--sm"],
    });
  });

  it("returns the selectors of rules that only changed order", () => {
    expect(
      changedSelectors(
        ".a{color:red}.b{color:blue}",
        ".b{color:blue}.a{color:red}",
      ),
    ).toEqual({ selectors: [".a"] });
  });

  it("returns no selectors for identical output", () => {
    expect(changedSelectors(BASE, `/* moved */${BASE}`)).toEqual({
      selectors: [],
    });
  });

  it("can't narrow rules that require no class, or other at-rules", () => {
    const changes = [
      BASE.replace("#fff", "#000"),
      BASE.replace("opacity: 1", "opacity: 0.5"),
      BASE.replace("a.woff2", "b.woff2"),
      `${BASE} :is(.bx--tag, span) { color: red; }`,
    ];
    for (const head of changes) {
      expect(changedSelectors(BASE, head)).toHaveProperty("reason");
    }
  });
});

describe("selectorSources", () => {
  const sources = new Map([
    ["src/Form/FormItem.svelte", `<div class="bx--form-item"></div>`],
    ["src/Checkbox/Checkbox.svelte", `<div class="bx--form-item"></div>`],
    ["src/Tag/Tag.svelte", `<div class="bx--tag bx--tag--{size}"></div>`],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source text
    ["src/Button/Button.svelte", "const cls = `bx--btn--${kind}`;"],
    ["src/Grid/Column.svelte", `const cls = "bx--col-" + size;`],
    ["e2e/fixtures/Raw.svelte", `<div class="bx--raw"></div>`],
  ]);

  it("finds literal and interpolated spellings", () => {
    expect(
      selectorSources(sources, [
        ".bx--tag--sm",
        ".bx--btn--primary",
        ".bx--col-lg",
        ".bx--raw",
      ]),
    ).toEqual({
      files: [
        "e2e/fixtures/Raw.svelte",
        "src/Button/Button.svelte",
        "src/Grid/Column.svelte",
        "src/Tag/Tag.svelte",
      ],
    });
  });

  it("keys each selector on its rarest spelled class", () => {
    expect(selectorSources(sources, [".bx--tag > .bx--form-item"])).toEqual({
      files: ["src/Tag/Tag.svelte"],
    });
    expect(selectorSources(sources, [".flatpickr-day .bx--btn--x"])).toEqual({
      files: ["src/Button/Button.svelte"],
    });
  });

  it("can't narrow a selector whose classes no source spells", () => {
    expect(selectorSources(sources, [".flatpickr-day"])).toHaveProperty(
      "reason",
    );
    expect(
      selectorSources(sources, [":is(.flatpickr-day, .bx--tag)"]),
    ).toHaveProperty("reason");
  });
});
