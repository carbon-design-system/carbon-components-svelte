// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

type Rule = ReturnType<typeof parseRules>[number];

// True when `a` outranks `b` in the cascade (source order not considered).
function outranks(a: Rule, b: Rule) {
  for (let i = 0; i < 3; i++) {
    if (a.specificity[i] !== b.specificity[i])
      return a.specificity[i] > b.specificity[i];
  }
  return false;
}

// Forced-colors mode repaints backgrounds as Canvas, so a bar drawn with a
// background colour disappears into its track. The patch uses system colors
// only (they survive forcing) and must outrank the status fills, which carry
// non-system colors that forcing would turn into Canvas.
describe("progress bar and meter in forced colors", () => {
  let css: string;
  let base: Rule[];
  let forced: Rule[];

  beforeAll(async () => {
    css = await compileEntry("white.scss");
    const rules = parseRules(css);
    forced = rules.filter((r) => r.context.includes("forced-colors"));
    base = rules.filter((r) => !r.context.includes("forced-colors"));
  }, 60_000);

  const forcedRule = (selector: string, prop: string, value: string) => {
    const rule = forced.find(
      (r) => r.selector === selector && r.decls.get(prop) === value,
    );
    expect(rule, `${selector} { ${prop}: ${value} }`).toBeDefined();
    return rule as Rule;
  };
  const baseRule = (selector: string) => {
    const rule = base.find((r) => r.selector === selector);
    expect(rule, selector).toBeDefined();
    return rule as Rule;
  };

  it("does not unforce colors", () => {
    for (const r of forced) {
      if (/progress-bar|meter/.test(r.selector))
        expect(r.decls.has("forced-color-adjust")).toBe(false);
    }
  });

  it("outlines the tracks", () => {
    for (const selector of [".bx--progress-bar__track", ".bx--meter__track"])
      forcedRule(selector, "outline", "1px solid CanvasText");
  });

  it("paints the meter bar with Highlight for every status", () => {
    const bar = forcedRule(
      ".bx--meter .bx--meter__track .bx--meter__bar",
      "background-color",
      "Highlight",
    );
    for (const status of ["success", "warning", "error"])
      expect(
        outranks(bar, baseRule(`.bx--meter--${status} .bx--meter__bar`)),
      ).toBe(true);
    expect(outranks(bar, baseRule(".bx--meter__bar"))).toBe(true);
  });

  it("paints meter thresholds with CanvasText for every kind", () => {
    const threshold = forcedRule(
      ".bx--meter__track .bx--meter__threshold",
      "background-color",
      "CanvasText",
    );
    for (const kind of ["warning", "error"])
      expect(
        outranks(threshold, baseRule(`.bx--meter__threshold--${kind}`)),
      ).toBe(true);
    expect(outranks(threshold, baseRule(".bx--meter__threshold"))).toBe(true);
  });

  it("paints the progress bar with Highlight", () => {
    const bar = forcedRule(
      ".bx--progress-bar .bx--progress-bar__bar",
      "background-color",
      "Highlight",
    );
    expect(outranks(bar, baseRule(".bx--progress-bar__bar"))).toBe(true);
  });

  it("draws the indeterminate segment as a solid box, not a gradient", () => {
    const selector =
      ".bx--progress-bar.bx--progress-bar--indeterminate .bx--progress-bar__track";
    const segment = forcedRule(
      `${selector}::after`,
      "background-color",
      "Highlight",
    );
    expect(segment.decls.get("background-image")).toBe("none");
    expect(segment.decls.get("width")).toBe("25%");
    expect(segment.decls.get("animation-name")).toBe(
      "progress-bar-indeterminate-forced-colors",
    );
    expect(
      outranks(
        segment,
        baseRule(
          ".bx--progress-bar--indeterminate .bx--progress-bar__track::after",
        ),
      ),
    ).toBe(true);
    // The segment starts and ends outside the track, so it must be clipped.
    forcedRule(selector, "overflow", "hidden");
    expect(css).toContain(
      "@keyframes progress-bar-indeterminate-forced-colors",
    );
  });
});
