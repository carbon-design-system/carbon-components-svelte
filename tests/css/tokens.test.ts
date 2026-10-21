// @vitest-environment node
// @depends-on src/tokens/tailwind.css
import { readFileSync } from "node:fs";
import {
  colorTokens,
  componentTokens,
  containerTokens,
  layoutTokens,
  sizeTokens,
  spacingTokens,
  typeTokens,
} from "carbon-components-svelte/tokens";
import tailwindPreset from "carbon-components-svelte/tokens/tailwind.js";
import dtcg from "carbon-components-svelte/tokens/tokens.json";
import {
  dtcgTokens,
  renderTailwindCss,
  tailwindTheme,
  toHex,
} from "../../scripts/lib/token-exports";
import { extractTokens, type TokenData } from "../../scripts/lib/tokens";
import { compileEntry } from "./compile";

const tailwindCss = readFileSync(
  new URL("../../src/tokens/tailwind.css", import.meta.url),
  "utf8",
);

let data: TokenData;

beforeAll(async () => {
  data = extractTokens(await compileEntry("all.scss"));
}, 60_000);

// A stale file means scripts/build-tokens.ts needs a rerun.
describe("token data", () => {
  it("matches the tokens all.css declares", () => {
    expect(colorTokens).toEqual(data.color);
    expect(componentTokens).toEqual(data.component);
    expect(typeTokens).toEqual(data.type);
    expect(spacingTokens).toEqual(data.spacing);
    expect(layoutTokens).toEqual(data.layout);
    expect(containerTokens).toEqual(data.container);
    expect(sizeTokens).toEqual(data.size);
  });

  it("gives every theme a value for each color", () => {
    expect(colorTokens.background).toEqual({
      white: "#ffffff",
      g10: "#f4f4f4",
      g80: "#393939",
      g90: "#262626",
      g100: "#161616",
    });
    // A contextual token holds its first-layer value.
    expect(colorTokens.layer).toEqual(colorTokens["layer-01"]);
    for (const values of [
      ...Object.values(colorTokens),
      ...Object.values(componentTokens),
    ]) {
      expect(Object.keys(values)).toEqual([
        "white",
        "g10",
        "g80",
        "g90",
        "g100",
      ]);
    }
  });

  it("exports only Carbon v11 names", () => {
    expect(typeTokens["heading-compact-01"]).toEqual({
      "font-size": "0.875rem",
      "font-weight": "600",
      "line-height": "1.28572",
      "letter-spacing": "0.16px",
    });
    expect(componentTokens).toHaveProperty("button-primary");
    expect(colorTokens).toHaveProperty("chat-bubble-user");

    for (const name of ["ui-background", "ui-01", "text-01", "brand-01"]) {
      expect(colorTokens).not.toHaveProperty(name);
    }
    for (const name of ["body-short-01", "productive-heading-01"]) {
      expect(typeTokens).not.toHaveProperty(name);
    }
  });
});

describe("Tailwind preset", () => {
  it("matches the tokens all.css declares", () => {
    expect(tailwindPreset).toEqual({ theme: { extend: tailwindTheme(data) } });
    // Biome wraps a long `var()` over three lines.
    const unwrap = (css: string) =>
      css.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    expect(unwrap(tailwindCss)).toBe(renderTailwindCss(data));
  });

  it("maps colors to the theme's custom properties", () => {
    const { colors, textColor, borderColor } = tailwindPreset.theme.extend;

    expect(colors.layer).toBe("var(--cds-layer)");
    expect(colors["layer-01"]).toBe("var(--cds-layer-01)");
    expect(colors["text-secondary"]).toBe("var(--cds-text-secondary)");
    expect(colors["button-primary"]).toBe("var(--cds-button-primary)");
    expect(Object.keys(colors)).toHaveLength(
      Object.keys(colorTokens).length + Object.keys(componentTokens).length,
    );

    // Short names: `text-secondary`, `border-subtle`.
    expect(textColor.secondary).toBe("var(--cds-text-secondary)");
    expect(borderColor.subtle).toBe("var(--cds-border-subtle)");
    expect(borderColor["subtle-01"]).toBe("var(--cds-border-subtle-01)");

    expect(tailwindCss).toContain("  --color-layer-01: var(--cds-layer-01);\n");
    expect(tailwindCss).toContain(
      "  --text-color-secondary: var(--cds-text-secondary);\n",
    );
    // `inline` resolves var(--cds-*) where the utility applies, so it
    // follows ThemeZone and Layer instead of the root theme.
    expect(tailwindCss.match(/^@theme\b.*\{$/gm)).toEqual([
      "@theme inline {",
      "@theme {",
    ]);
  });

  it("maps spacing, sizes, and type styles to literal values", () => {
    const { spacing, fontSize } = tailwindPreset.theme.extend;

    expect(spacing["spacing-05"]).toBe("1rem");
    expect(spacing["size-medium"]).toBe("2.5rem");
    expect(fontSize["heading-compact-01"]).toEqual([
      "0.875rem",
      { lineHeight: "1.28572", letterSpacing: "0.16px", fontWeight: "600" },
    ]);
    // Helper text sets no weight, as in Carbon.
    expect(fontSize["helper-text-01"][1]).not.toHaveProperty("fontWeight");

    expect(tailwindCss).toContain("  --spacing-spacing-05: 1rem;\n");
    expect(tailwindCss).toContain(
      "  --text-heading-compact-01--font-weight: 600;\n",
    );
  });

  it("gives every utility one meaning", () => {
    const { colors, textColor, borderColor, fontSize } =
      tailwindPreset.theme.extend;

    // Tailwind v3 and v4 both let the short name win, so
    // `border-interactive` reads the token of that name.
    expect(borderColor.interactive).toBe("var(--cds-border-interactive)");
    expect(colors.interactive).toBe("var(--cds-interactive)");

    // `text-*` is both a color and a type style.
    const textNames = new Set([
      ...Object.keys(colors),
      ...Object.keys(textColor),
    ]);
    for (const name of Object.keys(fontSize)) {
      expect(textNames.has(name), name).toBe(false);
    }
    expect(Object.keys(fontSize).length).toBeGreaterThan(20);
  });
});

describe("DTCG tokens", () => {
  const sets = ["core", "white", "g10", "g80", "g90", "g100"];

  it("matches the tokens all.css declares", () => {
    expect(dtcg).toEqual(dtcgTokens(data));
  });

  it("holds a core set and one color set per theme", () => {
    expect(Object.keys(dtcg)).toEqual([...sets, "$themes", "$metadata"]);
    expect(dtcg.$metadata).toEqual({ tokenSetOrder: sets });
    expect(dtcg.$themes[4]).toEqual({
      id: "g100",
      name: "Gray 100",
      selectedTokenSets: { core: "enabled", g100: "enabled" },
    });

    expect(dtcg.g100.background).toEqual({
      $type: "color",
      $value: "#161616",
    });
    expect(Object.keys(dtcg.g100)).toEqual(Object.keys(dtcg.white));
    expect(Object.keys(dtcg.white)).toHaveLength(
      Object.keys(colorTokens).length + Object.keys(componentTokens).length,
    );
  });

  it("writes every color as hex or as an alias", () => {
    for (const set of sets.slice(1)) {
      const tokens = Object.values(
        dtcg[set as keyof typeof dtcg] as Record<string, { $value: string }>,
      );
      for (const { $value } of tokens) {
        expect($value).toMatch(/^(#[\da-f]{6}([\da-f]{2})?|\{[\w-]+\})$/);
      }
    }
    expect(dtcg.white["background-active"].$value).toBe("#8d8d8d80");
    // `var(--cds-layer)` in all.css.
    expect(dtcg.g100["notification-background-error"].$value).toBe("{layer}");
  });

  it("writes type styles, spacing, and sizes in DTCG types", () => {
    expect(dtcg.core["heading-compact-01"]).toEqual({
      $type: "typography",
      $value: {
        fontSize: "0.875rem",
        fontWeight: 600,
        lineHeight: 1.28572,
        letterSpacing: "0.16px",
      },
    });
    expect(dtcg.core["code-01"].$value).toMatchObject({
      fontFamily: expect.arrayContaining(["IBM Plex Mono", "monospace"]),
      letterSpacing: "0.32px",
    });
    expect(dtcg.core["heading-02"].$value.letterSpacing).toBe("0px");
    expect(dtcg.core["spacing-05"]).toEqual({
      $type: "dimension",
      $value: "1rem",
    });
    expect(dtcg.core["size-small"].$value).toBe("2rem");
    // DTCG dimensions allow px and rem only, not vw.
    expect(dtcg.core).not.toHaveProperty("fluid-spacing-02");
  });

  it("converts each CSS color form to hex", () => {
    expect(toHex("#FFF")).toBe("#ffffff");
    expect(toHex("#0f62fe")).toBe("#0f62fe");
    expect(toHex("rgba(141, 141, 141, 0.5)")).toBe("#8d8d8d80");
    expect(toHex("rgb(100%, 50%, 0%)")).toBe("#ff8000");
    expect(() => toHex("transparent")).toThrow("Unsupported color");
  });
});
