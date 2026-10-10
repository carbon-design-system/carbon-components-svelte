// @vitest-environment node
// @depends-on css/syntax/_carbon-tokens.scss
import { readFileSync } from "node:fs";
import {
  contrast,
  contrastAdjustments,
  paletteNames,
  SYNTAX_TOKENS_FILE,
  syntaxTokensScss,
} from "../../scripts/lib/syntax-tokens";

describe("syntax tokens", () => {
  it("css/syntax/_carbon-tokens.scss matches the installed @carbon/themes", () => {
    // Regenerate with `bun run build:syntax-tokens`.
    expect(readFileSync(SYNTAX_TOKENS_FILE, "utf8")).toBe(syntaxTokensScss());
  });

  it("names each Carbon token after v11's kebab-cased syntax-* token", () => {
    const scss = syntaxTokensScss();
    expect(scss).toContain('    "control-keyword": $carbon--purple-70,');
    expect(scss).toContain('    "heading-1": $');
    expect(scss).toContain('    "null": $');
    const schemes = scss.slice(
      0,
      scss.indexOf("$ccs-syntax-contrast-adjustments"),
    );
    expect(schemes.match(/^ {4}"[a-z\d-]+": \$carbon--/gm)).toHaveLength(
      88 * 2,
    );
  });

  it("keeps the first palette name for a repeated hex value", () => {
    const names = paletteNames(
      "$carbon--gray-100: #161616 !default;\n$carbon--cool-gray-100: #161616 !default;\n",
    );
    expect(names.get("#161616")).toBe("carbon--gray-100");
  });

  it("throws on a color with no v10 palette name", () => {
    expect(() => syntaxTokensScss(new Map())).toThrow(
      /is not a v10 palette color/,
    );
  });

  it("moves a failing token to the nearest passing step of its family", () => {
    const palette = paletteNames(
      [
        "$carbon--blue-30: #a6c8ff !default;",
        "$carbon--blue-40: #78a9ff !default;",
        "$carbon--blue-50: #4589ff !default;",
        "$carbon--blue-60: #0f62fe !default;",
      ].join("\n"),
    );
    const keyword = {
      name: "keyword",
      variable: "carbon--blue-50",
      hex: "#4589ff",
    };
    // g90's background: blue-50 is 3.5:1, blue-40 the first step that passes.
    expect(contrast("#4589ff", "#393939")).toBeLessThan(4.5);
    expect(contrastAdjustments([keyword], "#393939", palette)).toEqual([
      { name: "keyword", variable: "carbon--blue-40", hex: "#78a9ff" },
    ]);
    // Passing tokens and diff backgrounds are left alone.
    expect(contrastAdjustments([keyword], "#161616", palette)).toEqual([]);
    expect(
      contrastAdjustments(
        [{ ...keyword, name: "inserted" }],
        "#393939",
        palette,
      ),
    ).toEqual([]);
    expect(() => contrastAdjustments([keyword], "#8d8d8d", palette)).toThrow(
      /no blue step/,
    );
  });
});
