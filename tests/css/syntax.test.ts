// @vitest-environment node
import { parseRules } from "crassus";
import {
  contrast,
  MIN_CONTRAST,
  SNIPPET_BACKGROUNDS,
} from "../../scripts/lib/syntax-tokens";
import { compileEntry } from "./compile";

const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

/** `--cds-syntax-*` declarations of the unconditional rule for `selector`. */
function syntaxTokens(css: string, selector: string) {
  const decls = parseRules(css)
    .filter((rule) => rule.selector === selector && rule.context === "")
    .flatMap((rule) => [...rule.decls]);
  return new Map(decls.filter(([prop]) => prop.startsWith("--cds-syntax-")));
}

describe("syntax stylesheets", () => {
  it("keeps the syntax tokens and rules out of all.css", async () => {
    const css = await compileEntry("all.scss");
    expect(css).not.toContain("--cds-syntax-");
    expect(css).not.toContain(".tok-");
  }, 30_000);

  it("syntax-tokens.css declares all 88 tokens, light on :root and dark once", async () => {
    const css = await compileEntry("syntax-tokens.scss");
    const light = syntaxTokens(css, ":root");
    expect(light.size).toBe(88);
    expect(light.get("--cds-syntax-keyword")).toBe("#0f62fe");
    expect(light.get("--cds-syntax-null")).toBe("#161616");

    // One dark set for g80, g90, and g100, then g80's and g90's contrast
    // adjustments in their own later rules.
    const dark = parseRules(css).find(
      (rule) => rule.selector === ":root[theme=g100]" && rule.context === "",
    );
    expect(dark?.decls.size).toBe(88);
    expect(dark?.decls.get("--cds-syntax-keyword")?.toString()).toBe("#4589ff");
    expect(
      syntaxTokens(css, ":root[theme=g80]").get("--cds-syntax-keyword"),
    ).toBe("#a6c8ff");
    expect(
      syntaxTokens(css, ":root[theme=g90]").get("--cds-syntax-keyword"),
    ).toBe("#78a9ff");
    // v11 gives g10 the same values as white, so it inherits `:root`'s.
    expect(syntaxTokens(css, ":root[theme=g10]").size).toBe(0);
    // Tokens only: no rules that style anything.
    expect(css).not.toContain(".tok-");
  }, 30_000);

  it("each static syntax-tokens-<theme>.css declares its theme's scheme", async () => {
    const themes = [
      ["white", "#198038"],
      ["g10", "#198038"],
      // green-40 is 3.3:1 on g80's snippet background.
      ["g80", "#6fdc8c"],
      ["g90", "#42be65"],
      ["g100", "#42be65"],
    ];
    const sheets = await Promise.all(
      themes.map(([theme]) => compileEntry(`syntax-tokens-${theme}.scss`)),
    );
    for (const [i, [theme, comment]] of themes.entries()) {
      const tokens = syntaxTokens(sheets[i], ":root");
      expect(tokens.size, theme).toBe(88);
      expect(tokens.get("--cds-syntax-comment"), theme).toBe(comment);
    }
  }, 60_000);

  it("every token reaches AA on its theme's CodeSnippet background", async () => {
    const sheets = await Promise.all(
      THEMES.flatMap((theme) => [
        compileEntry(`${theme}.scss`),
        compileEntry(`syntax-tokens-${theme}.scss`),
      ]),
    );
    for (const [i, theme] of THEMES.entries()) {
      const background = parseRules(sheets[i * 2])
        .find(
          (rule) =>
            rule.selector === ".bx--snippet--multi" && rule.context === "",
        )
        ?.decls.get("background-color")
        ?.toString();
      // The generator's backgrounds match the compiled themes.
      expect(background, theme).toBe(SNIPPET_BACKGROUNDS[theme]);
      const failing = [...syntaxTokens(sheets[i * 2 + 1], ":root")]
        .filter(([prop]) => !/-(inserted|deleted)$/.test(prop))
        .map(
          ([prop, value]) => [prop, contrast(value, background ?? "")] as const,
        )
        .filter(([, ratio]) => ratio < MIN_CONTRAST);
      expect(failing, theme).toEqual([]);
    }
  }, 120_000);

  it("syntax.css colors every token through its custom property", async () => {
    const css = await compileEntry("syntax.scss");
    const declared = syntaxTokens(
      await compileEntry("syntax-tokens.scss"),
      ":root",
    );
    const rules = parseRules(css);
    expect(rules).toHaveLength(88 * 2);

    for (const { selector, decls } of rules) {
      const type = selector.match(
        /^(?:\.tok-|::highlight\(syntax-)([\w-]+)/,
      )?.[1];
      expect(type, selector).toBeDefined();
      const property = ["inserted", "deleted"].includes(type ?? "")
        ? "background-color"
        : "color";
      expect([...decls.keys()], selector).toEqual([property]);
      expect(decls.get(property)?.toString(), selector).toContain(
        `var(--cds-syntax-${type})`,
      );
      expect(declared.has(`--cds-syntax-${type}`), selector).toBe(true);
    }
    // No theme values: the same sheet serves every theme.
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  }, 30_000);
});
