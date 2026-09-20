import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { parseRules } from "../../scripts/lib/css-cascade";

const CSS_DIR = join(__dirname, "../../css");

describe(":not() chains", () => {
  it("do not grow back where a marker class would do", async () => {
    const { css } = await compileAsync(join(CSS_DIR, "all.scss"), {
      style: "compressed",
      loadPaths: [join(CSS_DIR, "vendor")],
      quietDeps: true,
      silenceDeprecations: [
        "import",
        "global-builtin",
        "color-functions",
        "if-function",
      ],
      logger: { warn() {}, debug() {} },
    });
    const chains = (selector: string) =>
      (selector.match(/:not\(/g) ?? []).length;
    const selectors = [...new Set(parseRules(css).map((r) => r.selector))];
    // The pattern still matches: most `:not()` uses are a single guard.
    expect(selectors.filter((s) => chains(s) === 1).length).toBeGreaterThan(
      100,
    );
    // Each `:not(.class)` adds a class of specificity and names a state the
    // component could mark directly (`--neutral`, `--default`). Measured: 3
    // selectors with three, 5 with four (fluid date-picker and list-box).
    // Lower these as chains are replaced; do not raise them.
    expect(selectors.filter((s) => chains(s) >= 3).length).toBeLessThanOrEqual(
      8,
    );
    expect(selectors.filter((s) => chains(s) >= 5)).toEqual([]);
  }, 30_000);
});
