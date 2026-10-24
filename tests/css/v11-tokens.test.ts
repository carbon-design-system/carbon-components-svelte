// @vitest-environment node
// @depends-on src/** docs/src/** docs/svelte.config.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Token and type style names follow Carbon v11. v10 names (`ui-01`,
// `text-01`, `body-short-01`, …) are gone from the CSS: a stylesheet that
// still reads or overrides one would silently do nothing.

const V10_COLOR =
  /^(ui-0\d|ui-background|text-0\d|icon-0\d|link-0\d|interactive-0\d|inverse-0\d|inverse-(link|focus-ui|hover-ui|support-0\d)|support-0\d|danger(-0\d)?|disabled-0\d|hover-[a-z-]+|active-[a-z0-9-]+|selected(-light)?-ui|visited-link|decorative-01|skeleton-0\d|overlay-01|brand-0\d)$/;
const V10_TYPE =
  /^(caption-0\d|body-(short|long)-0\d|productive-heading-0\d|expressive-(heading|paragraph)-0\d|quotation-0\d|display-0\d)(-|$)/;
const isV10 = (name: string) => V10_COLOR.test(name) || V10_TYPE.test(name);

const NUMBERED = [
  ...["layer", "layer-active", "layer-hover", "layer-selected"].flatMap(
    (family) => ["01", "02", "03"].map((n) => `${family}-${n}`),
  ),
  ...["layer-selected-hover", "layer-accent", "layer-accent-active"].flatMap(
    (family) => ["01", "02", "03"].map((n) => `${family}-${n}`),
  ),
  "layer-accent-hover-01",
  "layer-accent-hover-02",
  "layer-accent-hover-03",
  "field-hover-01",
  "field-hover-02",
  "field-hover-03",
  "field-03",
  "border-subtle-00",
  "border-subtle-01",
  "border-subtle-02",
  "border-subtle-03",
  "border-strong-01",
  "border-strong-02",
  "border-strong-03",
  "border-subtle-selected-01",
  "border-subtle-selected-02",
  "border-subtle-selected-03",
];

const TYPE_STYLES = [
  "label-01",
  "label-02",
  "helper-text-01",
  "helper-text-02",
  "legal-01",
  "legal-02",
  "body-compact-01",
  "body-compact-02",
  "body-01",
  "body-02",
  "code-01",
  "code-02",
  "heading-compact-01",
  "heading-compact-02",
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => `heading-0${n}`),
  ...[3, 4, 5, 6].map((n) => `fluid-heading-0${n}`),
  "fluid-paragraph-01",
  "fluid-quotation-01",
  "fluid-quotation-02",
  ...[1, 2, 3, 4].map((n) => `fluid-display-0${n}`),
];

// Carbon v11 hooks. A consumer sets them, and the CSS reads each with the
// theme token or v11's default as its fallback, so nothing declares them.
const V11_HOOKS = new Set([
  "link-text-color",
  "link-hover-text-color",
  "link-visited-text-color",
  "link-focus-text-color",
  // The CSS Grid (`@carbon/grid` `css-grid`), which v11 declares on `:root`.
  "grid-gutter",
  "grid-columns",
  "grid-margin",
]);

describe("Carbon v11 tokens", () => {
  let css = "";
  beforeAll(async () => {
    css = await compileEntry("all.scss");
  }, 30_000);

  const declared = () =>
    new Set([...css.matchAll(/--cds-([\w-]+)\s*:/g)].map(([, name]) => name));
  const read = () =>
    new Set([...css.matchAll(/var\(--cds-([\w-]+)/g)].map(([, name]) => name));

  it("declares no v10 token names", () => {
    expect([...declared()].filter(isV10)).toEqual([]);
  });

  it("reads no v10 token names", () => {
    expect([...read()].filter(isV10)).toEqual([]);
  });

  it("declares every token it reads", () => {
    const names = declared();
    expect(
      [...read()].filter((name) => !names.has(name) && !V11_HOOKS.has(name)),
    ).toEqual([]);
    // Each hook is still read, so a stale entry does not hide a typo.
    expect([...V11_HOOKS].filter((name) => !read().has(name))).toEqual([]);
    // A declaration would shadow the value a consumer sets on an ancestor.
    expect([...V11_HOOKS].filter((name) => names.has(name))).toEqual([]);
  });

  // A scope that re-points a token nothing reads has no effect, which is how
  // a rename silently breaks an override (classic header tooltips).
  it("re-points only tokens something reads", () => {
    const names = read();
    const theme = new Set(
      parseRules(css)
        .filter((r) => r.selector === ":root" && r.context === "")
        .flatMap((r) => [...r.decls.keys()]),
    );
    const dead = parseRules(css)
      .filter((r) => !r.selector.startsWith(":root"))
      .flatMap((r) =>
        [...r.decls.keys()]
          .filter((prop) => prop.startsWith("--cds-"))
          .filter((prop) => !theme.has(prop))
          .filter((prop) => !names.has(prop.slice("--cds-".length)))
          .map((prop) => `${r.selector} ${prop}`),
      );
    expect(dead).toEqual([]);
  });

  it("declares the numbered layer and border tokens", () => {
    const names = declared();
    expect(NUMBERED.filter((name) => !names.has(name))).toEqual([]);
  });

  it("emits a helper class for each v11 type style, and no others", () => {
    const classes = new Set(
      [...css.matchAll(/\.bx--type-([a-z]+(?:-[a-z]+)*-\d{2})\b/g)].map(
        ([, name]) => name,
      ),
    );
    expect([...classes].sort()).toEqual([...TYPE_STYLES].sort());
  });

  // Markup that names a helper class the CSS no longer emits renders
  // unstyled, with no error (the docs' markdown headings did).
  it("uses only type helper classes that exist", () => {
    const roots = ["src", "docs/src"];
    const files = [
      "docs/svelte.config.ts",
      ...roots.flatMap((root) =>
        readdirSync(root, { recursive: true, encoding: "utf8" })
          .filter((file) => /\.(svelte|svx|ts|js|css)$/.test(file))
          .filter((file) => !file.includes("node_modules"))
          .map((file) => join(root, file)),
      ),
    ];
    const known = new Set(TYPE_STYLES);
    const unknown = files.flatMap((file) =>
      [
        ...readFileSync(file, "utf8").matchAll(
          /bx--type-([a-z]+(?:-[a-z]+)*-\d{2})\b/g,
        ),
      ]
        .map(([, name]) => name)
        .filter((name) => !known.has(name))
        .map((name) => `${file}: ${name}`),
    );
    expect(unknown).toEqual([]);
  });
});
