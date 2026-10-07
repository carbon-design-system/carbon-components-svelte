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

// The pressed and selected cues are background colours and an inset
// box-shadow, which forced-colors mode repaints or drops. The patch paints
// them with system colors, which survive forcing, and leaves
// `forced-color-adjust` alone: unforcing would restore the inset bar, the
// hover fills and the real `$focus` ring on top of the Highlight fill.
describe("pressed and selected states in forced colors", () => {
  let base: Rule[];
  let forced: Rule[];

  beforeAll(async () => {
    const rules = parseRules(await compileEntry("white.scss"));
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
      if (/toggle-button|tag--selectable/.test(r.selector))
        expect(r.decls.has("forced-color-adjust")).toBe(false);
    }
  });

  describe("ToggleButton", () => {
    const pressed =
      ".bx--toggle-button.bx--toggle-button--pressed:not(:disabled)";

    it("paints the pressed segment with Highlight above hover and active fills", () => {
      const rule = forcedRule(pressed, "background-color", "Highlight");
      expect(rule.decls.get("color")).toBe("HighlightText");
      expect(
        forcedRule(`${pressed} svg`, "fill", "HighlightText"),
      ).toBeDefined();
      for (const selector of [
        ".bx--toggle-button--pressed:hover",
        ".bx--toggle-button:hover",
        ".bx--toggle-button:active",
      ])
        expect(outranks(rule, baseRule(selector))).toBe(true);
    });

    it("draws the focus ring with a system color that contrasts with the fill", () => {
      const plain = forcedRule(
        ".bx--toggle-button:focus",
        "outline-color",
        "CanvasText",
      );
      const onHighlight = forcedRule(
        `${pressed}:focus`,
        "outline-color",
        "HighlightText",
      );
      expect(outranks(onHighlight, plain)).toBe(true);
      expect(outranks(onHighlight, baseRule(".bx--toggle-button:focus"))).toBe(
        true,
      );
    });

    it("mutes disabled segments and keeps the pressed one distinct", () => {
      forcedRule(".bx--toggle-button:disabled", "color", "GrayText");
      forcedRule(".bx--toggle-button:disabled svg", "fill", "GrayText");
      const rule = forcedRule(
        ".bx--toggle-button--pressed:disabled",
        "outline",
        "0.0625rem solid GrayText",
      );
      // The Highlight fill never applies to a disabled segment or tag.
      for (const r of forced) {
        if (
          /\.bx--(toggle-button|tag)\b/.test(r.selector) &&
          r.decls.get("background-color") === "Highlight"
        )
          expect(r.selector).toMatch(/:not\((:disabled|\.bx--tag--disabled)\)/);
      }
      expect(rule.decls.get("outline-offset")).toBe("-0.0625rem");
    });
  });

  describe("SelectableTag", () => {
    const selected =
      ".bx--tag--selectable.bx--tag--selectable-selected:not(.bx--tag--disabled)";

    it("paints the selected tag with Highlight above hover fills", () => {
      const rule = forcedRule(selected, "background-color", "Highlight");
      expect(rule.decls.get("color")).toBe("HighlightText");
      expect(
        outranks(rule, baseRule(".bx--tag--selectable-selected:hover")),
      ).toBe(true);
      expect(outranks(rule, baseRule(".bx--tag--selectable:hover"))).toBe(true);
    });

    it("keeps a focus ring in a system color", () => {
      const rule = forcedRule(
        ".bx--tag--selectable:focus",
        "outline-color",
        "CanvasText",
      );
      expect(rule.specificity).toEqual(
        baseRule(".bx--tag--selectable:focus").specificity,
      );
    });

    it("lets disabled win over selected and keeps selected distinct", () => {
      forcedRule(".bx--tag--selectable.bx--tag--disabled", "color", "GrayText");
      const rule = forcedRule(
        ".bx--tag--selectable.bx--tag--disabled.bx--tag--selectable-selected",
        "outline",
        "0.0625rem solid GrayText",
      );
      expect(outranks(rule, baseRule(".bx--tag--selectable:hover"))).toBe(true);
    });
  });
});
