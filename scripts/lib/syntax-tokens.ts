// @depends-on css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/colors/mixins.scss bun.lock
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { formatTokenName, g10, g90, g100, white } from "@carbon/themes";
import pkg from "@carbon/themes/package.json" with { type: "json" };

// Resolved from this file, not the working directory: the Svelte 3 and 4
// test harnesses run from tests-svelte3/ and tests-svelte4/.
const fromRoot = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

export const SYNTAX_TOKENS_FILE = fromRoot("css/syntax/_carbon-tokens.scss");

// v10's palette, which the vendored themes and every partial read.
const PALETTE_FILE = fromRoot(
  "css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/colors/mixins.scss",
);

const PALETTE_VARIABLE =
  /^\$(carbon--[a-z-]+-\d+): (#[0-9a-f]{6}) !default;/gim;
const SYNTAX_PREFIX = /^syntax-/;
const PALETTE_STEP = /^carbon--(.+)-(\d+)$/;

/**
 * The background CodeSnippet sits on in each theme: v10's `$ui-01`.
 * tests/css/syntax.test.ts checks these against the compiled themes.
 */
export const SNIPPET_BACKGROUNDS = {
  white: "#f4f4f4",
  g10: "#ffffff",
  g80: "#525252",
  g90: "#393939",
  g100: "#262626",
} as const;

/** WCAG AA for normal text. */
export const MIN_CONTRAST = 4.5;

// Diff tokens color the line's background, not its text.
const BACKGROUND_TOKENS = new Set(["inserted", "deleted"]);

type Theme = Record<string, unknown>;
type Entry = { name: string; variable: string; hex: string };

/** `syntaxControlKeyword` keys of a v11 theme, in Carbon's order. */
function syntaxKeys(theme: Theme): string[] {
  return Object.keys(theme).filter((key) => key.startsWith("syntax"));
}

/** Hex value (lowercase) to the first v10 palette variable that holds it. */
export function paletteNames(source: string): Map<string, string> {
  const names = new Map<string, string>();
  for (const [, name, hex] of source.matchAll(PALETTE_VARIABLE)) {
    const key = hex.toLowerCase();
    if (!names.has(key)) names.set(key, name);
  }
  return names;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two `#rrggbb` colors. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tokens below `MIN_CONTRAST` on `background`, each moved to the nearest
 * step of its own palette family that passes: lighter on a dark background,
 * darker on a light one. Throws when no step in the family passes.
 */
export function contrastAdjustments(
  entries: Entry[],
  background: string,
  palette: Map<string, string>,
): Entry[] {
  const steps = new Map<
    string,
    { step: number; variable: string; hex: string }[]
  >();
  for (const [hex, variable] of palette) {
    const [, family, step] = variable.match(PALETTE_STEP) ?? [];
    if (!family) continue;
    steps.set(family, [
      ...(steps.get(family) ?? []),
      { step: Number(step), variable, hex },
    ]);
  }
  const dark = luminance(background) < 0.18;
  return entries.flatMap((entry) => {
    if (BACKGROUND_TOKENS.has(entry.name)) return [];
    if (contrast(entry.hex, background) >= MIN_CONTRAST) return [];
    const [, family, step] = entry.variable.match(PALETTE_STEP) ?? [];
    const candidates = (steps.get(family) ?? [])
      .filter((s) => (dark ? s.step < Number(step) : s.step > Number(step)))
      .sort((a, b) => (dark ? b.step - a.step : a.step - b.step));
    const pick = candidates.find(
      (s) => contrast(s.hex, background) >= MIN_CONTRAST,
    );
    if (!pick) {
      throw new Error(
        `${entry.name} (${entry.variable}) has no ${family} step with ${MIN_CONTRAST}:1 on ${background}`,
      );
    }
    return [{ name: entry.name, variable: pick.variable, hex: pick.hex }];
  });
}

/**
 * The scheme's tokens with their v10 palette variables. Throws when a
 * pair of themes this file folds together (white/g10, g90/g100) drifts apart
 * or a value has no v10 palette name, so a Carbon upgrade can't silently
 * ship the wrong colors.
 */
function schemeEntries(
  [theme, twin]: [Theme, Theme],
  [themeName, twinName]: [string, string],
  palette: Map<string, string>,
): Entry[] {
  return syntaxKeys(theme).map((key) => {
    const value = String(theme[key]).toLowerCase();
    if (String(twin[key]).toLowerCase() !== value) {
      throw new Error(
        `${key} differs between ${themeName} (${theme[key]}) and ${twinName} (${twin[key]})`,
      );
    }
    const variable = palette.get(value);
    if (!variable) {
      throw new Error(`${key} (${value}) is not a v10 palette color`);
    }
    const name = formatTokenName(key).replace(SYNTAX_PREFIX, "");
    return { name, variable, hex: value };
  });
}

// Quoted: an unquoted `null` key is Sass's null value.
const line = ({ name, variable }: Entry) => `    "${name}": $${variable},`;

/** Contents of css/syntax/_carbon-tokens.scss for the installed `@carbon/themes`. */
export function syntaxTokensScss(
  palette = paletteNames(readFileSync(PALETTE_FILE, "utf8")),
): string {
  const light = schemeEntries([white, g10], ["white", "g10"], palette);
  const dark = schemeEntries([g100, g90], ["g100", "g90"], palette);
  const adjusted = Object.entries(SNIPPET_BACKGROUNDS).flatMap(
    ([theme, background]) => {
      const scheme = theme === "white" || theme === "g10" ? light : dark;
      const entries = contrastAdjustments(scheme, background, palette);
      return entries.length
        ? [`  ${theme}: (\n${entries.map(line).join("\n")}\n  ),`]
        : [];
    },
  );
  return `// Generated by scripts/build-syntax-tokens.ts from @carbon/themes@${pkg.version}.
// Do not edit; run \`bun run build:syntax-tokens\` after upgrading it.
// Emits no CSS.

@import "carbon-components/scss/globals/scss/vars";

/// Carbon v11's \`syntax-*\` tokens. v11 gives white and g10 the same values,
/// and g90 and g100 the same values; v11 has no g80, so it takes the dark set.
/// @access private
/// @group syntax
/// @type Map
$ccs-syntax-tokens: (
  light: (
${light.map(line).join("\n")}
  ),
  dark: (
${dark.map(line).join("\n")}
  ),
);

/// Per theme, the tokens below ${MIN_CONTRAST}:1 on that theme's CodeSnippet
/// background, moved to the nearest step of the same palette family that
/// passes. Carbon tunes its one dark set for g100, so g80 and g90 need these.
/// @access private
/// @group syntax
/// @type Map
$ccs-syntax-contrast-adjustments: (
${adjusted.join("\n")}
);
`;
}
