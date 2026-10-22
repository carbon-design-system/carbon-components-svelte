// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";
import { contrast, THEMES, themeTokens } from "./helpers";

describe("success text color", () => {
  it("reads a library token, not the support-success indicator color", async () => {
    const { rules } = await themeTokens();
    const color = (selector: string) =>
      rules.find((r) => r.selector === selector)?.decls.get("color");
    expect(color(".bx--type-text-success")).toBe("var(--ccs-text-success)");
    expect(color(".bx--big-number__delta-value--success")).toBe(
      "var(--ccs-text-success)",
    );
  }, 30_000);

  // Small text needs 4.5:1. Carbon's text-error passes on the background and
  // the first two layers, so success text holds the same bar.
  it.each(THEMES)(
    "passes AA wherever text-error does in %s",
    async (theme) => {
      const tokens = (await themeTokens()).themes[theme];
      const success = tokens["--ccs-text-success"];
      expect(success).toMatch(/^#[\da-f]{6}$/);
      for (const surface of ["background", "layer-01", "layer-02"]) {
        const background = tokens[`--cds-${surface}`];
        expect(
          contrast(tokens["--cds-text-error"], background),
          `text-error on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(success, background),
          `text-success on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
    30_000,
  );

  it.each([
    ["white.scss", "#198038"],
    ["g100.scss", "#42be65"],
  ])(
    "compiles the theme's value into %s",
    async (entry, value) => {
      const rule = parseRules(await compileEntry(entry)).find(
        (r) => r.selector === ".bx--type-text-success",
      );
      expect(rule?.decls.get("color")).toBe(value);
    },
    60_000,
  );
});
