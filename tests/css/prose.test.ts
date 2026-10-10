// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const GUARD =
  /:where\(:not\(\[class\*="?bx--"?\]\):not\(\.bx--prose \[class\*="?bx--"?\]:not\(\.bx--prose\) \*\)\)/;

describe("prose", () => {
  it("guards every element rule against Carbon elements and their descendants, at zero specificity", async () => {
    const selectors = parseRules(await compileEntry("all.scss"))
      .map((r) => r.selector)
      .filter((s) => s.includes("bx--prose"));
    const elementRules = selectors.filter(
      (s) =>
        // The root, its variants, and the root's rhythm rules space every
        // child, components included.
        !/^\.bx--prose(--\w+)?$/.test(s) &&
        !/^\.bx--prose>(\*\+\*|\*\+(h\d|section|article)|h\d\+\*)$/.test(s) &&
        // Prose's own classes, such as the heading anchor.
        !s.includes("bx--prose__"),
    );

    expect(elementRules.length).toBeGreaterThan(20);
    for (const selector of elementRules) {
      expect(selector, selector).toMatch(GUARD);
    }
  }, 30_000);

  it("skips rendering offscreen code blocks and figures with the defer-offscreen modifier", async () => {
    const rules = parseRules(await compileEntry("all.scss")).filter((r) =>
      r.selector.includes("bx--prose--defer-offscreen"),
    );
    const selectors = rules.map((r) => r.selector).join(",");

    expect(selectors).toMatch(/\.bx--prose--defer-offscreen pre:where/);
    expect(selectors).toMatch(/\.bx--prose--defer-offscreen figure:where/);
    expect(selectors).not.toMatch(/table/);
    for (const rule of rules) {
      expect(rule.decls.get("content-visibility")).toBe("auto");
      expect(rule.decls.get("contain-intrinsic-size")).toBe("auto 10rem");
    }
  }, 30_000);
});
