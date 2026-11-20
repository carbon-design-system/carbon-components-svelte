// @vitest-environment node
import { fileURLToPath } from "node:url";
import { colorTokens, componentTokens } from "carbon-components-svelte/tokens";
import { compileString } from "sass-embedded";
import {
  apca,
  contrast,
  deltaE,
  fromOklch,
  parseColor,
  toOklch,
} from "../../src/ThemeBuilder/color.js";
import {
  baseValue,
  checkContrast,
  CONTEXTUAL,
  CONTRAST_PAIRS,
  decodeShare,
  DERIVATIONS,
  deriveColor,
  encodeShare,
  groupOf,
  minimizeOverrides,
  normalizeValue,
  parseTheme,
  previewStyle,
  resolveTheme,
  THEME_NAMES,
  toCss,
  toDtcg,
  TOKEN_GROUPS,
  TOKEN_NAMES,
  tokensByGroup,
  toScss,
} from "../../src/ThemeBuilder/theme-model.js";

const color = (value: string) => {
  const parsed = parseColor(value);
  assert(parsed, value);
  return parsed;
};

describe("color math", () => {
  it("matches the WCAG and APCA reference values", () => {
    expect(contrast(color("#000"), color("#fff"))).toBeCloseTo(21, 5);
    expect(contrast(color("#767676"), color("#fff"))).toBeCloseTo(4.54, 2);
    expect(apca(color("#000"), color("#fff"))).toBeCloseTo(106.04, 1);
    expect(apca(color("#fff"), color("#000"))).toBeCloseTo(-107.88, 1);
  });

  it("composites a translucent foreground over the background", () => {
    const half = contrast(color("rgba(0, 0, 0, 0.5)"), color("#fff"));
    expect(half).toBeCloseTo(contrast(color("#808080"), color("#fff")), 1);
  });

  it("round-trips sRGB through OKLCH and clips out-of-gamut chroma", () => {
    for (const hex of ["#0f62fe", "#da1e28", "#8d8d8d", "#f1c21b"]) {
      expect(deltaE(fromOklch(toOklch(color(hex))), color(hex))).toBeLessThan(
        0.1,
      );
    }
    const clipped = fromOklch({ l: 0.5, c: 0.5, h: 150 });
    expect(Math.max(clipped.r, clipped.g, clipped.b)).toBeLessThanOrEqual(1);
  });
});

describe("token model", () => {
  it("covers every v11 color and component token once", () => {
    expect(TOKEN_NAMES).toHaveLength(
      Object.keys(colorTokens).length + Object.keys(componentTokens).length,
    );
    const grouped = Object.values(tokensByGroup()).flat();
    expect(grouped.sort()).toEqual([...TOKEN_NAMES].sort());
    expect(TOKEN_GROUPS.map((group) => group.id)).toContain(
      groupOf("layer-hover-01"),
    );
    expect(groupOf("button-primary")).toBe("interactive");
    expect(groupOf("tag-color-red")).toBe("components");
  });

  it("names real tokens in every derivation, alias, and contrast pair", () => {
    const known = new Set(TOKEN_NAMES);
    for (const { token, from } of DERIVATIONS) {
      expect(known.has(token) && known.has(from), `${from} -> ${token}`).toBe(
        true,
      );
    }
    for (const [alias, numbered] of Object.entries(CONTEXTUAL)) {
      expect(known.has(alias) && known.has(numbered), alias).toBe(true);
      // An alias is its numbered token in every base theme.
      for (const theme of THEME_NAMES) {
        expect(baseValue(theme, alias), `${theme} ${alias}`).toBe(
          baseValue(theme, numbered),
        );
      }
    }
    for (const { fg, bg } of CONTRAST_PAIRS) {
      expect(known.has(fg) && known.has(bg), `${fg} on ${bg}`).toBe(true);
    }
  });
});

describe("derivation against the real v11 values", () => {
  it("reproduces Carbon's own step from the base value", () => {
    const errors: number[] = [];
    for (const theme of THEME_NAMES) {
      for (const { token, from, themes } of DERIVATIONS) {
        if (themes && !themes.includes(theme)) continue;
        const source = baseValue(theme, from) as string;
        const target = baseValue(theme, token) as string;
        const derived = deriveColor(source, source, target);
        if (!derived) continue;
        errors.push(deltaE(color(derived), color(target)));
      }
    }
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    expect(errors.length).toBeGreaterThan(250);
    // About 2 is the smallest difference most people see.
    expect(mean).toBeLessThan(0.5);
    expect(Math.max(...errors)).toBeLessThan(3.5);
  });

  it("carries a step learned on blue to the other hues", () => {
    // Carbon's red 60 hover and active, from the blue 60 step.
    for (const theme of THEME_NAMES) {
      const red = baseValue(theme, "button-danger-primary") as string;
      for (const [from, to, real] of [
        ["button-primary", "button-primary-hover", "button-danger-hover"],
        ["button-primary", "button-primary-active", "button-danger-active"],
      ]) {
        const derived = deriveColor(
          red,
          baseValue(theme, from) as string,
          baseValue(theme, to) as string,
        );
        assert(derived);
        expect(
          deltaE(color(derived), color(baseValue(theme, real) as string)),
        ).toBeLessThan(3);
      }
    }
  });

  it("keeps a tag's hover step across hues", () => {
    const errors: number[] = [];
    for (const theme of THEME_NAMES) {
      const blueBg = baseValue(theme, "tag-background-blue") as string;
      const blueHover = baseValue(theme, "tag-hover-blue") as string;
      for (const hue of ["red", "teal", "purple", "cyan", "green"]) {
        const derived = deriveColor(
          baseValue(theme, `tag-background-${hue}`) as string,
          blueBg,
          blueHover,
        );
        assert(derived);
        errors.push(
          deltaE(
            color(derived),
            color(baseValue(theme, `tag-hover-${hue}`) as string),
          ),
        );
      }
    }
    expect(errors.reduce((a, b) => a + b, 0) / errors.length).toBeLessThan(4);
  });

  it("skips translucent colors", () => {
    expect(deriveColor("#ffffff", "rgba(0, 0, 0, 0.1)", "#000000")).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("returns nothing for no overrides", () => {
    expect(resolveTheme("g100", {}).tokens).toEqual({});
  });

  it("steps the tokens Carbon derives from an override", () => {
    const { tokens, sources } = resolveTheme("white", {
      "button-primary": "#8a3ffc",
    });
    expect(tokens["button-primary"]).toBe("#8a3ffc");
    expect(sources["button-primary-hover"]).toBe("derived");
    expect(tokens["button-primary-hover"]).not.toBe("#0050e6");
    // The brand reaches interactive and links, and links then step.
    expect(sources.interactive).toBe("derived");
    expect(sources["link-primary-hover"]).toBe("derived");
    expect(sources.focus).toBe("derived");
  });

  it("keeps the brand lighter in a dark theme, as Carbon does", () => {
    const { tokens } = resolveTheme("g100", { "button-primary": "#8a3ffc" });
    expect(toOklch(color(tokens.interactive)).l).toBeGreaterThan(
      toOklch(color(tokens["button-primary"])).l,
    );
    // Carbon keeps focus white on a dark theme.
    expect(tokens.focus).toBeUndefined();
  });

  it("lets an explicit token win and stops there", () => {
    const { tokens, sources } = resolveTheme("white", {
      "button-primary": "#8a3ffc",
      "button-primary-hover": "#111111",
    });
    expect(tokens["button-primary-hover"]).toBe("#111111");
    expect(sources["button-primary-hover"]).toBe("override");
  });

  it("does not derive when derive is off", () => {
    const { tokens } = resolveTheme(
      "white",
      { "button-primary": "#8a3ffc" },
      { derive: false },
    );
    expect(tokens).toEqual({ "button-primary": "#8a3ffc" });
  });

  it("sets the contextual token an override of layer-01 stands for", () => {
    const { tokens, sources } = resolveTheme("white", {
      "layer-01": "#eef3ff",
    });
    expect(tokens.layer).toBe("#eef3ff");
    expect(sources.layer).toBe("alias");
    expect(tokens["layer-hover"]).toBe(tokens["layer-hover-01"]);
  });

  it("drops a value that equals the base theme", () => {
    expect(resolveTheme("white", { "layer-01": "#F4F4F4" }).tokens).toEqual({});
  });

  it("ignores names that are not tokens", () => {
    const hostile = JSON.parse(
      '{"__proto__":"#fff","constructor":"#fff","nope":"#fff"}',
    );
    expect(resolveTheme("white", hostile).tokens).toEqual({});
  });
});

describe("value safety", () => {
  it.each([
    "#fff",
    "#0F62FE",
    "#0f62fe80",
    "rgb(1, 2, 3)",
    "rgba(141, 141, 141, 0.5)",
    "rgb(1 2 3 / 50%)",
    "var(--cds-layer)",
  ])("accepts %s", (value) => {
    expect(normalizeValue(value)).toBe(value.toLowerCase());
  });

  it.each([
    "red",
    "#12345",
    "#fff; background: url(//x)",
    "rgb(1, 2, 3); color: red",
    "url(//x)",
    "var(--cds-a) }",
    "expression(alert(1))",
    "}\n:root { --x: 1",
    "/* */ #fff",
    "var(--other)",
    "",
    "x".repeat(200),
  ])("rejects %j", (value) => {
    expect(normalizeValue(value)).toBeNull();
  });

  it("keeps a bad value out of the style, the CSS, and the share link", () => {
    const hostile = {
      "layer-01": "#fff; background: url(x)",
      interactive: "#abc",
    };
    expect(previewStyle(hostile)).toBe("--cds-interactive:#abc");
    expect(toCss(hostile)).not.toContain("url");
    expect(encodeShare("white", hostile)).toBe("b=white&interactive=abc");
  });

  it("falls back to :root for a selector that could end the rule", () => {
    expect(toCss({}, { selector: ".brand, [data-x='1']" })).toMatch(
      /^\.brand, \[data-x='1'\] \{/,
    );
    expect(toCss({}, { selector: "a { } b" })).toMatch(/^:root \{/);
    expect(toCss({}, { selector: "a /* x" })).toMatch(/^:root \{/);
  });
});

describe("contrast", () => {
  it("lists Carbon's own failures as base failures, not new ones", () => {
    const baseFails = (theme: (typeof THEME_NAMES)[number]) =>
      checkContrast(theme, {})
        .filter((row) => row.status !== "pass")
        .map((row) => `${row.fg}/${row.bg}`);
    expect(baseFails("white")).toEqual(["support-warning/background"]);
    expect(baseFails("g100")).toEqual(["text-placeholder/field-03"]);
    for (const theme of THEME_NAMES) {
      expect(
        checkContrast(theme, {}).filter((row) => row.status === "fail"),
      ).toEqual([]);
    }
  });

  it("flags a pair an override pushes below its minimum", () => {
    const { tokens } = resolveTheme("white", { "button-primary": "#f1c21b" });
    const rows = checkContrast("white", tokens);
    const row = rows.find(
      (r) => r.fg === "text-on-color" && r.bg === "button-primary",
    );
    expect(row?.status).toBe("fail");
    expect(row?.ratio).toBeLessThan(4.5);
    expect(row?.min).toBe(4.5);
    expect(Math.abs(row?.lc ?? 0)).toBeGreaterThan(0);
  });

  it("follows var() aliases and translucent backgrounds", () => {
    // notification-background-* is var(--cds-layer) on dark themes.
    const rows = checkContrast("g100", { layer: "#ffffff" });
    const row = rows.find(
      (r) =>
        r.fg === "text-primary" && r.bg === "notification-background-error",
    );
    expect(row?.ratio).toBeLessThan(2);
  });
});

describe("export and import", () => {
  const overrides = { "button-primary": "#8a3ffc", "layer-01": "#1b2a4a" };
  const { tokens } = resolveTheme("g100", overrides);

  it("writes CSS custom properties", () => {
    const css = toCss(tokens, { selector: ".brand" });
    expect(css).toMatch(/^\.brand \{\n {2}--cds-button-primary: #8a3ffc;/);
    expect(css).toContain("--cds-layer: #1b2a4a;");
  });

  it("writes Sass that Carbon's theme module accepts", () => {
    const scss = toScss("g100", tokens);
    expect(scss).toContain("$fallback: themes.$g100");
    expect(scss).toContain("layer-01: #1b2a4a,");
    // Contextual tokens are not keys of Carbon's theme map.
    expect(scss).not.toMatch(/^ {4}layer: /m);
    // Component tokens go in a map of their own.
    expect(scss).toContain("$component-tokens: (");
    expect(scss).toContain("button-primary: #8a3ffc,");

    const { css } = compileString(
      `${scss.replaceAll("@carbon/styles/scss/", "@carbon/themes/scss/")}\n:root { @include theme.theme(); }`,
      {
        loadPaths: [
          fileURLToPath(new URL("../../node_modules", import.meta.url)),
        ],
        logger: { warn() {}, debug() {} },
      },
    );
    expect(css).toContain("--cds-layer-01: #1b2a4a;");
    expect(css).toContain("--cds-button-primary: #8a3ffc;");
  });

  it("falls back to Gray 90 for Gray 80, which Carbon does not have", () => {
    const scss = toScss("g80", resolveTheme("g80", {}).tokens);
    expect(scss).toContain("themes.$g90");
    expect(scss).toContain("background: #393939,");
  });

  it("writes Design Tokens JSON in the shape of tokens.json", () => {
    const json = toDtcg("g100", {
      layer: "#1b2a4a",
      "notification-background-error": "var(--cds-layer)",
      "layer-hover": "rgba(141, 141, 141, 0.5)",
    });
    expect(json.overrides.layer).toEqual({ $type: "color", $value: "#1b2a4a" });
    expect(json.overrides["notification-background-error"].$value).toBe(
      "{layer}",
    );
    expect(json.overrides["layer-hover"].$value).toBe("#8d8d8d80");
    expect(json.$themes[0].selectedTokenSets).toEqual({
      g100: "source",
      overrides: "enabled",
    });
    expect(json.$metadata.tokenSetOrder).toEqual(["g100", "overrides"]);
  });

  it("reads back what it wrote, in each format", () => {
    const fromCss = parseTheme(toCss(tokens));
    expect(fromCss.tokens).toEqual(tokens);

    const fromJson = parseTheme(JSON.stringify(toDtcg("g100", tokens)));
    expect(fromJson.base).toBe("g100");
    expect(fromJson.tokens).toEqual(tokens);
    expect(
      parseTheme(
        JSON.stringify({
          "notification-background-error": { $value: "{layer}" },
        }),
      ).tokens,
    ).toEqual({ "notification-background-error": "var(--cds-layer)" });

    expect(parseTheme(JSON.stringify(overrides)).tokens).toEqual(overrides);
    expect(
      parseTheme(JSON.stringify({ base: "g10", tokens: overrides })).base,
    ).toBe("g10");
  });

  it("reads a full theme set from tokens.json as its differences", () => {
    const set = Object.fromEntries(
      TOKEN_NAMES.map((token) => [
        token,
        { $type: "color", $value: baseValue("g90", token) },
      ]),
    );
    set["layer-01"].$value = "#112233";
    const parsed = parseTheme(JSON.stringify({ g90: set, core: {} }));
    expect(parsed.base).toBe("g90");
    expect(parsed.tokens).toEqual({ "layer-01": "#112233" });
  });

  it("reports what it skipped", () => {
    const parsed = parseTheme(
      "--cds-layer-01: #fff;\n--cds-nope: #fff;\n--cds-interactive: red;",
    );
    expect(parsed.tokens).toEqual({ "layer-01": "#fff" });
    expect(parsed.invalid.sort()).toEqual(["interactive", "nope"]);
    expect(parseTheme("hello").invalid).toContain("(no tokens found)");
  });

  it("minimizes an exported theme back to the tokens a person set", () => {
    expect(minimizeOverrides("g100", tokens)).toEqual(overrides);
    // Nothing is lost: the minimal set resolves to the same theme.
    expect(
      resolveTheme("g100", minimizeOverrides("g100", tokens)).tokens,
    ).toEqual(tokens);
  });

  it("round-trips a share link and drops what it cannot trust", () => {
    const hash = encodeShare("g90", overrides);
    expect(hash).toBe("b=g90&button-primary=8a3ffc&layer-01=1b2a4a");
    expect(decodeShare(`#${hash}`)).toEqual({ base: "g90", tokens: overrides });
    expect(decodeShare("b=nope&layer-01=fff")).toBeNull();
    expect(decodeShare("")).toBeNull();
    expect(
      decodeShare("b=white&layer-01=fff&bad=fff&interactive=red")?.tokens,
    ).toEqual({ "layer-01": "#fff" });
    const rgba = { "layer-hover": "rgba(141, 141, 141, 0.5)" };
    expect(decodeShare(encodeShare("white", rgba))?.tokens).toEqual(rgba);
  });
});
