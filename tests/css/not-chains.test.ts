// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe(":not() chains", () => {
  it("do not grow back where a marker class would do", async () => {
    const css = await compileEntry("all.scss", "compressed");
    // `:not()` inside `:where()` adds no specificity, which is the cost this
    // check guards against, so `:where()` groups are dropped before counting.
    const withoutWhere = (selector: string) => {
      let out = "";
      for (let i = 0; i < selector.length; i++) {
        if (selector.startsWith(":where(", i)) {
          let depth = 0;
          for (i += ":where".length; i < selector.length; i++) {
            if (selector[i] === "(") depth++;
            else if (selector[i] === ")" && --depth === 0) break;
          }
        } else out += selector[i];
      }
      return out;
    };
    const chains = (selector: string) =>
      (withoutWhere(selector).match(/:not\(/g) ?? []).length;
    const selectors = [...new Set(parseRules(css).map((r) => r.selector))];
    // The pattern still matches: most `:not()` uses are a single guard.
    expect(selectors.filter((s) => chains(s) === 1).length).toBeGreaterThan(
      100,
    );
    // Each `:not(.class)` adds a class of specificity and names a state the
    // component could mark directly (`--neutral`, `--default`). Measured: 2
    // selectors remain, both in the Tabs dismissible hover-suppression rule
    // (`_tabs.scss`), left for the hover-guard pass that already rewrites
    // that block. Lower this as chains are replaced; do not raise it.
    expect(selectors.filter((s) => chains(s) >= 3).length).toBeLessThanOrEqual(
      2,
    );
    expect(selectors.filter((s) => chains(s) >= 5)).toEqual([]);
  }, 30_000);
});
