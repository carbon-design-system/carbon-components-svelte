// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

/** `--*` declarations per theme in all.css, each filled in from white. */
async function themeTokens() {
  const rules = parseRules(await compileEntry("all.scss"));
  const block = (selector: string) =>
    Object.fromEntries(
      rules
        .filter((r) => r.selector === selector && r.context === "")
        .flatMap((r) => [...r.decls])
        .filter(([prop]) => prop.startsWith("--")),
    );
  const white = block(":root");
  return {
    rules,
    themes: Object.fromEntries(
      THEMES.map((theme) => [
        theme,
        theme === "white"
          ? white
          : { ...white, ...block(`:root[theme=${theme}]`) },
      ]),
    ) as Record<(typeof THEMES)[number], Record<string, string>>,
  };
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

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
