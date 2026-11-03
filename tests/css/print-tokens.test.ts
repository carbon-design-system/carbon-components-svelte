// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";
import { contrast, themeTokens } from "./helpers";

const printTokens = (rules: ReturnType<typeof parseRules>, selector: string) =>
  Object.fromEntries(
    rules
      .filter((r) => r.selector === selector && r.context === "@media print")
      .flatMap((r) => [...r.decls]),
  );

describe("print tokens", () => {
  it.each(["g80", "g90", "g100"])(
    "prints %s.css on White's text, surface, border and link tokens",
    async (theme) => {
      const rules = parseRules(await compileEntry(`${theme}.scss`));
      const print = printTokens(rules, ":root");
      const white = (await themeTokens()).themes.white;
      for (const token of [
        "--cds-text-primary",
        "--cds-text-secondary",
        "--cds-background",
        "--cds-layer-01",
        "--cds-border-subtle",
        "--cds-link-primary",
        "--cds-icon-primary",
      ]) {
        expect(print[token], token).toBe(white[token]);
      }
      expect(Object.keys(print)).not.toContain("--cds-button-primary");
    },
    60_000,
  );

  it.each(["white", "g10"])(
    "leaves %s.css as it is",
    async (theme) => {
      const rules = parseRules(await compileEntry(`${theme}.scss`));
      expect(printTokens(rules, ":root")).toEqual({});
    },
    60_000,
  );

  it("prints every dark theme and zone of all.css as dark text on a light surface", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    for (const theme of ["g80", "g90", "g100"]) {
      const print = printTokens(rules, `:root[theme=${theme}]`);
      expect(
        contrast(print["--cds-text-primary"], print["--cds-background"]),
        theme,
      ).toBeGreaterThanOrEqual(7);
      expect(printTokens(rules, `.bx--${theme}`)["--cds-text-primary"]).toBe(
        print["--cds-text-primary"],
      );
    }
    expect(printTokens(rules, ":root[theme=g10]")).toEqual({});
  }, 60_000);
});
