// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe(":not() chains", () => {
  it("do not grow back where a marker class would do", async () => {
    const css = await compileEntry("all.scss", "compressed");
    const chains = (selector: string) =>
      (selector.match(/:not\(/g) ?? []).length;
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
