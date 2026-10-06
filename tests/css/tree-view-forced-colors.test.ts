// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

type Rule = ReturnType<typeof parseRules>[number];

const NOT_DISABLED = ":not(.bx--tree-node--disabled)";

// True when `a` outranks `b` in the cascade.
function outranks(a: Rule, b: Rule) {
  for (let i = 0; i < 3; i++) {
    if (a.specificity[i] !== b.specificity[i])
      return a.specificity[i] > b.specificity[i];
  }
  return false;
}

// The selected node is a background tint (plus a bar in multiselect) and the
// disabled node a lighter text colour. Forced colors repaint both, so selected,
// disabled and plain nodes looked identical. The patch uses system colors only
// (they survive forcing) and must outrank the base hover/focus rules, which
// carry non-system colors that forcing would turn into `Canvas`/blue.
describe("tree view in forced colors", () => {
  let all: Rule[];
  let forced: Rule[];
  let base: Rule[];

  beforeAll(async () => {
    all = parseRules(await compileEntry("white.scss"));
    forced = all.filter(
      (r) => r.context.includes("forced-colors") && r.selector.includes("tree"),
    );
    base = all.filter((r) => !r.context.includes("forced-colors"));
  }, 60_000);

  const forcedRule = (selector: string, prop: string, value: string) => {
    const rule = forced.find(
      (r) =>
        r.selector === `.bx--tree ${selector}` && r.decls.get(prop) === value,
    );
    expect(rule, `${selector} { ${prop}: ${value} }`).toBeDefined();
    return rule as Rule;
  };
  const baseRule = (selector: string) => {
    const rule = base.find((r) => r.selector === `.bx--tree ${selector}`);
    expect(rule, selector).toBeDefined();
    return rule as Rule;
  };

  it("does not unforce colors, so base shadows and rings stay suppressed", () => {
    expect(forced.length).toBeGreaterThan(0);
    for (const r of forced)
      expect(r.decls.has("forced-color-adjust")).toBe(false);
  });

  it("paints the selected node with Highlight, also on hover", () => {
    const sel = `.bx--tree-node--selected${NOT_DISABLED}>.bx--tree-node__label`;
    const plain = forcedRule(sel, "background-color", "Highlight");
    const hover = forcedRule(`${sel}:hover`, "background-color", "Highlight");
    expect(plain?.decls.get("color")).toBe("HighlightText");
    expect(hover?.decls.get("color")).toBe("HighlightText");

    const baseHover = baseRule(
      ".bx--tree-node--selected>.bx--tree-node__label:hover",
    );
    expect(baseHover).toBeDefined();
    expect(outranks(hover, baseHover)).toBe(true);
  });

  it("keeps hover text and icons of a selected node readable", () => {
    const sel = `.bx--tree-node--selected${NOT_DISABLED}>.bx--tree-node__label`;
    const details = forcedRule(
      `${sel} .bx--tree-node__label__details`,
      "color",
      "HighlightText",
    );
    const baseDetails = baseRule(
      ".bx--tree-node__label:hover .bx--tree-node__label__details",
    );
    expect(outranks(details, baseDetails)).toBe(true);

    for (const icon of [
      ".bx--tree-parent-node__toggle-icon",
      ".bx--tree-node__icon",
    ]) {
      const rule = forcedRule(`${sel} ${icon}`, "fill", "HighlightText");
      const baseHoverIcon = baseRule(`.bx--tree-node__label:hover ${icon}`);
      expect(outranks(rule, baseHoverIcon)).toBe(true);
    }
  });

  it("draws the focus ring of a selected node with a system color", () => {
    const rule = forcedRule(
      `.bx--tree-node--selected${NOT_DISABLED}:focus>.bx--tree-node__label`,
      "outline-color",
      "HighlightText",
    );
    const baseFocus = baseRule(".bx--tree-node:focus>.bx--tree-node__label");
    expect(baseFocus?.decls.has("outline")).toBe(true);
    expect(outranks(rule, baseFocus)).toBe(true);
  });

  it("keeps the active and selected bars visible", () => {
    const active = forcedRule(
      `.bx--tree-node--active:not(.bx--tree-node--selected)${NOT_DISABLED}>.bx--tree-node__label::before`,
      "background-color",
      "CanvasText",
    );
    const selected = forcedRule(
      `.bx--tree-node--selected${NOT_DISABLED}>.bx--tree-node__label::before`,
      "background-color",
      "HighlightText",
    );
    const baseActive = baseRule(
      ".bx--tree-node--active>.bx--tree-node__label::before",
    );
    const baseMulti = base.find(
      (r) =>
        r.selector ===
        ".bx--tree--multiselect .bx--tree-node--selected>.bx--tree-node__label::before",
    );
    expect(outranks(active, baseActive)).toBe(true);
    // Selected rows sit on Highlight, so the bar flips to HighlightText; the
    // two selectors are disjoint, so source order never decides.
    expect(baseMulti).toBeDefined();
    expect(outranks(selected, baseMulti as Rule)).toBe(true);
  });

  it("greys out disabled nodes, also on hover, and never fills them", () => {
    const dis = ".bx--tree-node.bx--tree-node--disabled";
    const baseDis = ".bx--tree-node--disabled";
    const label = ".bx--tree-node__label";
    const details = ".bx--tree-node__label__details";
    const icons = [
      ".bx--tree-parent-node__toggle-icon",
      ".bx--tree-node__icon",
    ];
    const gray = (selector: string, prop = "color") =>
      forcedRule(selector, prop, "GrayText");

    // Each state must outrank the base disabled/hover rule it shadows.
    const pairs: [Rule, Rule][] = [
      [gray(dis), baseRule(baseDis)],
      [gray(`${dis} ${label}:hover`), baseRule(`${baseDis} ${label}:hover`)],
      [
        gray(`${dis} ${label}:hover ${details}`),
        baseRule(`${baseDis} ${label}:hover ${details}`),
      ],
      [
        gray(`${dis} ${label} ${details}`),
        baseRule(`${label}:hover ${details}`),
      ],
    ];
    for (const icon of icons) {
      const baseIcon = baseRule(`${baseDis} ${label}:hover ${icon}`);
      pairs.push(
        [gray(`${dis} ${label}:hover ${icon}`, "fill"), baseIcon],
        [
          gray(`${dis} ${label} ${icon}`, "fill"),
          baseRule(`${label}:hover ${icon}`),
        ],
      );
    }
    for (const [patch, baseOne] of pairs)
      expect(outranks(patch, baseOne)).toBe(true);

    // Disabled wins over selected: the selected fill excludes disabled nodes.
    for (const r of forced) {
      if (r.decls.get("background-color") === "Highlight")
        expect(r.selector).toContain(NOT_DISABLED);
    }
  });
});
