import { parseRules, type Rule } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

async function compileAll(): Promise<Rule[]> {
  const css = await compileEntry("all.scss");
  return parseRules(css);
}

describe("css-only tooltip mixins", () => {
  it("emit the shared show/hide state once, not per direction", async () => {
    const rules = await compileAll();
    const hidden = new Set(
      rules
        .filter((rule) => rule.selector.includes(".bx--tooltip--hidden"))
        .filter((rule) => !rule.selector.includes(":not(.bx--tooltip--hidden)"))
        .map((rule) => rule.selector.replace(/(::before| \S+|\+\S+)$/, "")),
    );
    expect([...hidden].sort()).toEqual([
      ".bx--tooltip__trigger.bx--tooltip--a11y.bx--tooltip--hidden",
      ".bx--tooltip__trigger.bx--tooltip--a11y.bx--tooltip--hidden.bx--tooltip--a11y",
    ]);
  }, 30_000);

  it("emit exactly one `--cds-tooltip-*` consumer rule per pseudo-element role", async () => {
    // The direction x alignment x type geometry (see the `tooltip--
    // geometry-*` mixins in globals/scss/_tooltip.scss) is redesigned
    // around custom properties: a handful of short setter rules per
    // direction/alignment/type, consumed by one declaration block per
    // pseudo-element role. If a future edit reintroduces a literal
    // offset/transform value inside one of the direction-qualified
    // selector groups instead of going through a var(), this would start
    // matching more than once (or the literal value would show up as a
    // duplicate declaration across selectors) and fail here.
    const rules = await compileAll();
    // `parseRules` expands a grouped selector list (`.a, .b { ... }`) into
    // one `Rule` per selector for cascade/specificity analysis, so a single
    // physical declaration block shared by all 8 trigger families shows up
    // as 8 `Rule`s here with an identical `declBlock`; dedupe by that to
    // count physical rules, not selectors matched.
    const isSetter = (rule: Rule) =>
      [...rule.decls.keys()].every((prop) => prop.startsWith("--cds-tooltip-"));
    const isConsumer = (rule: Rule) =>
      !isSetter(rule) &&
      [...rule.decls.values()].some((v) => v.includes("var(--cds-tooltip-"));
    const byRole = (prop: string) =>
      new Set(
        rules
          .filter((rule) => isConsumer(rule) && rule.decls.has(prop))
          .map((rule) => rule.declBlock),
      ).size;

    expect(byRole("border-width")).toBe(1); // ::before (caret)
    expect(byRole("transform")).toBe(2); // ::before (caret) + ::after/assistive-text (body)
    expect(byRole("width")).toBe(1); // .assistive-text::after (hover bridge)
  }, 30_000);

  it("every direction/alignment setter writes a complete opposite-side pair", async () => {
    // Each setter rule must reset *both* sides of the axis it owns (e.g.
    // both `--cds-tooltip-caret-top` and `--cds-tooltip-caret-bottom`), not
    // just whichever one differs from a previously-included direction -
    // otherwise a tooltip trigger nested inside a different-direction
    // trigger's DOM subtree could inherit a stray value the ancestor set
    // for an axis this trigger's own rules don't otherwise touch (see
    // `TooltipMatrixFixture`'s nested-trigger case).
    const rules = await compileAll();
    const pairs: [string, string][] = [
      ["--cds-tooltip-caret-top", "--cds-tooltip-caret-bottom"],
      ["--cds-tooltip-caret-left", "--cds-tooltip-caret-right"],
      ["--cds-tooltip-body-top", "--cds-tooltip-body-bottom"],
      ["--cds-tooltip-body-left", "--cds-tooltip-body-right"],
      ["--cds-tooltip-hover-top", "--cds-tooltip-hover-bottom"],
      ["--cds-tooltip-hover-left", "--cds-tooltip-hover-right"],
    ];
    for (const rule of rules) {
      for (const [a, b] of pairs) {
        if (rule.decls.has(a) || rule.decls.has(b)) {
          expect([rule.selector, rule.decls.has(a), rule.decls.has(b)]).toEqual(
            [rule.selector, true, true],
          );
        }
      }
    }
  }, 30_000);

  it("duplicates definition's main-axis and align vars onto its sibling assistive text", async () => {
    // `TooltipDefinition`'s assistive text is a *sibling* of the trigger
    // (`+ .bx--assistive-text`), not a descendant like the icon trigger's -
    // custom properties only inherit down the DOM tree, never sideways to
    // a sibling, so the sibling selector needs its own copy of the vars
    // instead of relying on inheritance from the preceding trigger.
    const rules = await compileAll();
    const definitionSiblingSetters = rules.filter(
      (rule) =>
        rule.selector.includes("bx--tooltip__trigger--definition") &&
        rule.selector.trim().endsWith("+.bx--assistive-text") &&
        [...rule.decls.keys()].some((k) => k.startsWith("--cds-tooltip-body-")),
    );
    expect(definitionSiblingSetters.length).toBeGreaterThan(0);
  }, 30_000);
});
