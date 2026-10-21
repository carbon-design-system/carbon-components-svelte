// @vitest-environment node
import { colors, hoverColors } from "@carbon/colors";
import { buttonTokens, g10, g90, g100, white } from "@carbon/themes";
import { carbonPalette } from "carbon-components-svelte/Theme/carbon-palette.js";
import { createTheme } from "carbon-components-svelte/Theme/create-theme.js";
import { colorTokens, componentTokens } from "carbon-components-svelte/tokens";
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
} from "carbon-components-svelte/utils/color-contrast.js";

const CARBON_THEMES = { white, g10, g90, g100 };
const BUTTON_THEME_KEYS = {
  white: "whiteTheme",
  g10: "g10",
  g90: "g90",
  g100: "g100",
} as const;
const GRADES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

function camelCase(token: string) {
  return token.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/** A token's value in a Carbon v11 theme from @carbon/themes. */
function carbonValue(theme: keyof typeof CARBON_THEMES, token: string) {
  const name = camelCase(token);
  const buttons: Record<string, Record<string, string>> = buttonTokens;
  if (name in buttons) return buttons[name][BUTTON_THEME_KEYS[theme]];
  const values: Record<string, unknown> = CARBON_THEMES[theme];
  return values[name];
}

function luminance(hex: string) {
  const rgb = parseHex(hex);
  assert(rgb);
  return relativeLuminance(rgb);
}

describe("carbonPalette", () => {
  it("matches @carbon/colors", () => {
    const families = Object.keys(carbonPalette);
    expect(families.sort()).toEqual(
      Object.keys(colors)
        .filter((family) => family !== "black" && family !== "white")
        .sort(),
    );
    for (const family of families) {
      const grades = colors[family as keyof typeof colors] as Record<
        number,
        string
      >;
      const hovers = hoverColors[
        `${family}Hover` as keyof typeof hoverColors
      ] as Record<number, string>;
      expect(carbonPalette[family]).toEqual({
        grades: GRADES.map((grade) => grades[grade]),
        hover: GRADES.map((grade) => hovers[grade]),
      });
    }
  });
});

describe("createTheme", () => {
  it.each(["white", "g10", "g90", "g100"] as const)(
    "derives Carbon's own %s tokens from blue 60",
    (theme) => {
      const { tokens, warnings } = createTheme({ theme, brand: "#0f62fe" });
      expect(Object.keys(tokens).length).toBeGreaterThan(10);
      for (const [token, value] of Object.entries(tokens)) {
        expect(value, token).toBe(carbonValue(theme, token));
      }
      expect(warnings).toEqual([]);
    },
  );

  it("derives the library's g80 tokens from blue 60, with v11's hover", () => {
    const { tokens } = createTheme({ theme: "g80", brand: "#0f62fe" });
    const library: Record<string, Record<string, string>> = {
      ...colorTokens,
      ...componentTokens,
    };
    for (const [token, value] of Object.entries(tokens)) {
      if (token === "button-primary-hover") {
        expect(value).toBe(hoverColors.blueHover[60]);
      } else {
        expect(value, token).toBe(library[token].g80);
      }
    }
  });

  it("leaves tokens Carbon doesn't tie to the brand", () => {
    for (const theme of ["white", "g90"] as const) {
      const { tokens } = createTheme({ theme, brand: "#d02670" });
      expect(tokens).not.toHaveProperty("support-info");
      expect(tokens).not.toHaveProperty("link-visited");
    }
    expect(
      createTheme({ theme: "g100", brand: "#d02670" }).tokens,
    ).not.toHaveProperty("focus");
  });

  it.each(Object.keys(carbonPalette))(
    "steps a %s 60 brand through its own family",
    (family) => {
      const { grades, hover } = carbonPalette[family];
      const light = createTheme({ brand: grades[5] }).tokens;
      expect(light["button-primary-hover"]).toBe(hover[5]);
      expect(light["button-primary-active"]).toBe(grades[7]);
      expect(light["link-primary-hover"]).toBe(grades[6]);
      expect(light["link-inverse"]).toBe(grades[3]);
      expect(light.highlight).toBe(grades[1]);

      const dark = createTheme({ theme: "g100", brand: grades[5] }).tokens;
      expect(dark.interactive).toBe(grades[4]);
      expect(dark["link-primary"]).toBe(grades[3]);
      expect(dark["link-primary-hover"]).toBe(grades[2]);
      expect(dark.highlight).toBe(grades[8]);
    },
  );

  // One step off the palette, the brand goes through the luminance model. It
  // lands within 10% of the luminance of Carbon's own step, about as close as
  // Carbon's families are to each other.
  it.each(Object.keys(carbonPalette))(
    "matches Carbon's luminance steps for a %s brand off the palette",
    (family) => {
      const { grades, hover } = carbonPalette[family];
      const brand = grades[5].replace(/.$/, (digit) =>
        digit === "0" ? "1" : (Number.parseInt(digit, 16) - 1).toString(16),
      );
      const light = createTheme({ brand }).tokens;
      const dark = createTheme({ theme: "g100", brand }).tokens;
      const pairs: [string | undefined, string][] = [
        [light["button-primary-hover"], hover[5]],
        [light["button-primary-active"], grades[7]],
        [light["link-primary-hover"], grades[6]],
        [light["link-inverse"], grades[3]],
        [dark.interactive, grades[4]],
        [dark["link-primary"], grades[3]],
        [dark["link-primary-hover"], grades[2]],
      ];
      expect(brand).not.toBe(grades[5]);
      for (const [derived, carbon] of pairs) {
        assert(derived);
        const ratio = luminance(derived) / luminance(carbon);
        expect(Math.abs(ratio - 1), `${derived} for ${carbon}`).toBeLessThan(
          0.1,
        );
      }
    },
  );

  it("derives known tokens for a brand off the palette", () => {
    expect(createTheme({ brand: "#7c3aed" }).tokens).toEqual({
      "button-primary": "#7c3aed",
      "button-primary-hover": "#6618ea",
      "button-primary-active": "#3e0d91",
      "background-brand": "#7c3aed",
      "button-tertiary": "#7c3aed",
      "button-tertiary-hover": "#6618ea",
      "button-tertiary-active": "#3e0d91",
      interactive: "#7c3aed",
      "border-interactive": "#7c3aed",
      focus: "#7c3aed",
      "icon-interactive": "#7c3aed",
      "link-primary": "#7c3aed",
      "link-primary-hover": "#5813ce",
      "link-secondary": "#5813ce",
      "link-inverse": "#b38df5",
      "link-inverse-hover": "#ccb2f8",
      highlight: "#e1d2fb",
    });
    expect(createTheme({ theme: "g100", brand: "#7c3aed" }).tokens).toEqual({
      "button-primary": "#7c3aed",
      "button-primary-hover": "#6618ea",
      "button-primary-active": "#3e0d91",
      "background-brand": "#7c3aed",
      interactive: "#9a67f1",
      "border-interactive": "#9a67f1",
      "focus-inverse": "#7c3aed",
      "link-primary": "#b38df5",
      "link-primary-hover": "#ccb2f8",
      "link-secondary": "#ccb2f8",
      "link-inverse": "#7c3aed",
      "link-inverse-hover": "#5813ce",
      highlight: "#290960",
    });
  });

  it("hovers darker up to grade 60 and lighter from grade 70, like Carbon", () => {
    const light = "#3d7eff";
    const dark = "#002d9d";
    const lightHover = createTheme({ brand: light }).tokens[
      "button-primary-hover"
    ];
    const darkHover = createTheme({ brand: dark }).tokens[
      "button-primary-hover"
    ];
    assert(lightHover && darkHover);
    expect(luminance(lightHover)).toBeLessThan(luminance(light));
    expect(luminance(darkHover)).toBeGreaterThan(luminance(dark));
  });

  it("gives pure black a visible hover", () => {
    const { tokens } = createTheme({ brand: "#000" });
    expect(tokens["button-primary"]).toBe("#000000");
    expect(tokens["button-primary-hover"]).not.toBe("#000000");
  });

  it("normalizes the brand to lowercase #rrggbb", () => {
    expect(createTheme({ brand: "#0F62FE" }).tokens["button-primary"]).toBe(
      "#0f62fe",
    );
    expect(createTheme({ brand: "#06f" }).tokens["button-primary"]).toBe(
      "#0066ff",
    );
  });

  it("lets tokens win over derived ones, and drops undefined", () => {
    const { tokens } = createTheme({
      brand: "#0f62fe",
      tokens: {
        focus: undefined,
        "link-primary": "#0043ce",
        "layer-01": "#eee",
      },
    });
    expect(tokens).not.toHaveProperty("focus");
    expect(tokens["link-primary"]).toBe("#0043ce");
    expect(tokens["layer-01"]).toBe("#eee");
  });

  it("returns the base theme, defaulting to white", () => {
    expect(createTheme({ brand: "#0f62fe" }).theme).toBe("white");
    expect(createTheme({ theme: "g90", brand: "#0f62fe" }).theme).toBe("g90");
  });

  it.each(["0f62fe", "#0f62fe80", "rgb(15, 98, 254)", ""])(
    "throws a TypeError for the brand %j",
    (brand) => {
      expect(() => createTheme({ brand })).toThrow(TypeError);
    },
  );

  it("throws a TypeError for an unknown theme", () => {
    // @ts-expect-error "g50" is not a theme.
    expect(() => createTheme({ theme: "g50", brand: "#0f62fe" })).toThrow(
      /unknown theme "g50"/,
    );
  });

  it("runs without a DOM, for server rendering", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(createTheme({ brand: "#0f62fe" }).css()).toContain(
      "--cds-button-primary: #0f62fe;",
    );
  });
});

describe("createTheme warnings", () => {
  it.each(["white", "g10", "g80", "g90", "g100"] as const)(
    "has none for blue 60 on %s",
    (theme) => {
      expect(createTheme({ theme, brand: "#0f62fe" }).warnings).toEqual([]);
    },
  );

  it("flags a light brand on a light theme", () => {
    const { warnings } = createTheme({ brand: "#f1c21b" });
    expect(warnings).toEqual([
      {
        foreground: "text-on-color",
        background: "button-primary",
        ratio: 1.68,
        minimum: 4.5,
        message:
          "text-on-color (#ffffff) on button-primary (#f1c21b) has a contrast of 1.68:1. WCAG AA needs 4.5:1.",
      },
      {
        foreground: "link-primary",
        background: "background",
        ratio: 1.68,
        minimum: 4.5,
        message:
          "link-primary (#f1c21b) on background (#ffffff) has a contrast of 1.68:1. WCAG AA needs 4.5:1.",
      },
      {
        foreground: "focus",
        background: "background",
        ratio: 1.68,
        minimum: 3,
        message:
          "focus (#f1c21b) on background (#ffffff) has a contrast of 1.68:1. WCAG AA needs 3:1.",
      },
    ]);
  });

  it("checks against the base theme's background", () => {
    const { warnings } = createTheme({ theme: "g100", brand: "#0f62fe" });
    expect(warnings).toEqual([]);
    const dark = createTheme({ theme: "g100", brand: "#001d6c" });
    const link = dark.warnings.find((w) => w.foreground === "link-primary");
    assert(link);
    expect(link.ratio).toBe(
      Math.floor(
        (contrastRatio(
          String(dark.tokens["link-primary"]),
          colorTokens.background.g100,
        ) ?? 0) * 100,
      ) / 100,
    );
  });

  it("uses overrides in the checks", () => {
    const fixed = createTheme({
      brand: "#f1c21b",
      tokens: {
        "text-on-color": "#161616",
        "link-primary": "#8e6a00",
        focus: "#161616",
      },
    });
    expect(fixed.warnings).toEqual([]);

    const background = createTheme({
      brand: "#0f62fe",
      tokens: { background: "#0043ce" },
    });
    expect(background.warnings.map((w) => w.foreground)).toEqual([
      "link-primary",
      "focus",
    ]);
  });

  it("skips a pair it can't measure", () => {
    const { warnings } = createTheme({
      brand: "#f1c21b",
      tokens: { "text-on-color": "var(--brand-text)", background: "#fff8" },
    });
    expect(warnings).toEqual([]);
  });

  it("rounds the ratio down so a failing pair never shows 4.5", () => {
    // White on #008580 is 4.49995:1.
    const { warnings } = createTheme({ brand: "#008580" });
    expect(warnings.map((w) => w.ratio)).toEqual([4.49, 4.49]);
  });
});

describe("createTheme css", () => {
  it("scopes the tokens to the base theme", () => {
    const { css } = createTheme({
      theme: "g100",
      brand: "#0f62fe",
      tokens: { focus: "#ffffff" },
    });
    expect(css()).toBe(`:root[theme="g100"] {
  --cds-button-primary: #0f62fe;
  --cds-button-primary-hover: #0050e6;
  --cds-button-primary-active: #002d9c;
  --cds-background-brand: #0f62fe;
  --cds-interactive: #4589ff;
  --cds-border-interactive: #4589ff;
  --cds-focus-inverse: #0f62fe;
  --cds-link-primary: #78a9ff;
  --cds-link-primary-hover: #a6c8ff;
  --cds-link-secondary: #a6c8ff;
  --cds-link-inverse: #0f62fe;
  --cds-link-inverse-hover: #0043ce;
  --cds-highlight: #001d6c;
  --cds-focus: #ffffff;
}
`);
  });

  it("takes a custom selector", () => {
    const { css } = createTheme({ brand: "#0f62fe" });
    expect(css(".brand").startsWith(".brand {\n  --cds-button-primary:")).toBe(
      true,
    );
  });
});
