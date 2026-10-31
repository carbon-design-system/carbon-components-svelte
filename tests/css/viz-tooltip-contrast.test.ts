import { compileEntry } from "./compile";

// The tooltip sits on the inverse surface, which has one text token. Every
// text in it, rows and the fold line alike, must use it and clear 4.5:1 in
// every theme; a field or layer token there reads near 2:1.
const THEMES = ["white", "g10", "g90", "g100"];

function luminance(hex: string): number {
  const h =
    hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The declarations of the first rule for `selector` in expanded CSS. */
function rule(css: string, selector: string) {
  const escaped = selector.replace(/[.-]/g, "\\$&");
  return (
    css.match(new RegExp(`(?:^|\\n)${escaped} \\{\\n([^}]*)\\}`))?.[1] ?? ""
  );
}

/**
 * A token's value in a theme: the theme's own block when it overrides it,
 * else the root block it inherits from. A selector list may span lines
 * (`:root,\n.bx--white, …`), so blocks are read from `}` to `{`.
 */
function themeTokens(css: string, theme: string) {
  const blocks = [...css.matchAll(/(?:^|\})\s*([^{}]*?)\s*\{([^}]*)\}/g)];
  const bodies = (pick: (selector: string) => boolean) =>
    blocks.filter(([, selector]) => pick(selector)).map(([, , body]) => body);
  const own = bodies(
    (selector) =>
      selector.includes(`theme=${theme}]`) ||
      selector.split(",").some((part) => part.trim() === `.bx--${theme}`),
  );
  const root = bodies(
    (selector) =>
      selector.split(",").some((part) => part.trim() === ":root") &&
      !selector.includes("[theme="),
  );
  return (name: string) => {
    const pattern = new RegExp(`--cds-${name}:\\s*(#[0-9a-fA-F]{3,6})\\b`);
    for (const body of [...own, ...root]) {
      const match = body.match(pattern);
      if (match) return match[1];
    }
    throw new Error(`--cds-${name} is not declared in ${theme}`);
  };
}

describe("viz tooltip contrast", () => {
  it("colors the tooltip and its fold line with the inverse text token", async () => {
    const css = await compileEntry("viz.scss");
    const box = rule(css, ".bx--viz-chart-tooltip");
    expect(box).toMatch(/color:\s*var\(--cds-text-inverse\)/);
    expect(box).toMatch(/background:\s*var\(--cds-background-inverse\)/);
    expect(rule(css, ".bx--viz-chart-tooltip__more")).toMatch(
      /color:\s*var\(--cds-text-inverse\)/,
    );
  }, 60_000);

  it.each(THEMES)(
    "inverse text clears 4.5:1 on the inverse surface in %s",
    async (theme) => {
      const token = themeTokens(await compileEntry("all.scss"), theme);
      const ratio = contrast(
        token("text-inverse"),
        token("background-inverse"),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
    120_000,
  );
});
