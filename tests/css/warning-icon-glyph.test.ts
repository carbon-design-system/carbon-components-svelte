// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("warning icon glyph", () => {
  // A warning icon is yellow in every theme, so its "!" is black in every
  // theme. A theme token flips to white in the light themes, about 1.5:1
  // on the yellow.
  it("fills the inner path of every warning icon with a fixed color", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const glyphs = rules.filter(
      (r) =>
        /warn/.test(r.selector) &&
        /path(\[fill\]|:first-of-type|\[data-icon-path)/.test(r.selector) &&
        r.decls.has("fill"),
    );
    expect(glyphs.length).toBeGreaterThan(10);
    for (const rule of glyphs)
      expect([rule.selector, rule.decls.get("fill")]).toEqual([
        rule.selector,
        expect.not.stringContaining("var("),
      ]);
  }, 30_000);

  it.each(["inline", "toast"])(
    "fills the %s notification glyph for both warning kinds",
    async (type) => {
      const rules = parseRules(await compileEntry("all.scss"));
      for (const kind of ["warning", "warning-alt"]) {
        const selector = `.bx--${type}-notification--${kind} .bx--${type}-notification__icon path[data-icon-path=inner-path]`;
        const rule = rules.find((r) =>
          r.selector
            .split(/,\s*/)
            .some((s) => s.replace(/['"]/g, "") === selector),
        );
        expect(rule?.decls.get("fill")).toBeDefined();
      }
    },
    30_000,
  );
});
