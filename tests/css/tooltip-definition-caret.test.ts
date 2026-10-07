// @vitest-environment node
import { parseRules, type Rule } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

const compare = (a: Rule["specificity"], b: Rule["specificity"]) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const wins = (rule: Rule, over: Rule) => {
  const bySpecificity = compare(rule.specificity, over.specificity);
  return bySpecificity > 0 || (bySpecificity === 0 && rule.order > over.order);
};

describe("tooltip definition caret", () => {
  it("stays visible once the tooltip shows", async () => {
    // The definition trigger body hides its caret with `opacity: 0` at the
    // same specificity as the shared visible/hover/focus `opacity: 1`.
    // Emitted after it, the caret faded in and then snapped back to hidden.
    const rules = parseRules(await compileEntry("all.scss"));
    const hidden = rules.filter(
      (r) =>
        r.selector.includes(".bx--tooltip__trigger--definition") &&
        r.selector.endsWith("::before") &&
        r.decls.get("opacity") === "0" &&
        !r.selector.includes("--hidden"),
    );
    const shown = rules.filter(
      (r) =>
        /^\.bx--tooltip__trigger\.bx--tooltip--a11y(\.bx--tooltip--visible|:hover|:focus)::before$/.test(
          r.selector,
        ) && r.decls.get("opacity") === "1",
    );

    expect(hidden.length).toBeGreaterThan(0);
    expect(shown).toHaveLength(3);
    for (const show of shown) {
      for (const hide of hidden) expect(wins(show, hide)).toBe(true);
    }
  });
});
