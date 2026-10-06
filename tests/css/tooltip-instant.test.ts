// @vitest-environment node
import { parseRules, type Rule } from "crassus";
import { compileEntry } from "./compile";

const target = (rule: Rule) =>
  rule.selector.endsWith("::before")
    ? "caret"
    : rule.selector.includes("+.bx--assistive-text") ||
        rule.selector.includes("+ .bx--assistive-text")
      ? "sibling"
      : "descendant";

/** Positive when `a` wins over `b` on specificity, zero on a tie. */
const compare = (a: Rule["specificity"], b: Rule["specificity"]) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const wins = (rule: Rule, over: Rule) => {
  const bySpecificity = compare(rule.specificity, over.specificity);
  return bySpecificity > 0 || (bySpecificity === 0 && rule.order > over.order);
};

describe("tooltip instant handoff", () => {
  it("`bx--tooltip--instant` drops the fade-in and wins over every fade rule", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const fades = rules.filter((r) =>
      r.decls.get("animation")?.startsWith("tooltip-fade"),
    );
    const instant = rules.filter((r) =>
      r.selector.includes(".bx--tooltip--instant"),
    );

    expect(fades.length).toBeGreaterThan(0);
    expect(new Set(instant.map(target))).toEqual(
      new Set(["caret", "sibling", "descendant"]),
    );
    for (const rule of instant) {
      expect(rule.decls.get("animation")).toBe("none");
      for (const fade of fades.filter((f) => target(f) === target(rule))) {
        expect(wins(rule, fade)).toBe(true);
      }
    }
  });
});
