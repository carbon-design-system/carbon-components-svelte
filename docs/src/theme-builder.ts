import type {
  CarbonTheme,
  CarbonToken,
} from "carbon-components-svelte/src/Theme/Theme.svelte";
import { colorTokens, componentTokens } from "carbon-components-svelte/tokens";

type Tokens = Partial<Record<CarbonToken, string>>;

export const brandPresets = [
  { name: "Blue 60", color: "#0f62fe" },
  { name: "Purple 60", color: "#8a3ffc" },
  { name: "Teal 60", color: "#007d79" },
  { name: "Magenta 60", color: "#d02670" },
  { name: "Red 60", color: "#da1e28" },
  { name: "Yellow 30", color: "#f1c21b" },
  { name: "Indigo", color: "#4f46e5" },
];

const baseTokens: Record<string, Record<CarbonTheme, string>> = {
  ...colorTokens,
  ...componentTokens,
};

const OVERRIDE_LINE = /^(?:--cds-)?([a-z0-9-]+)\s*:\s*(.+?);?$/;
const BARE_KEY = /^[a-z]\w*$/i;

/**
 * Parse `token: value` lines. Lines that name no color token are returned in
 * `invalid`.
 */
export function parseOverrides(text: string) {
  const tokens: Tokens = {};
  const invalid: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [, token, value] = trimmed.match(OVERRIDE_LINE) ?? [];
    if (token && token in baseTokens) {
      tokens[token as CarbonToken] = value;
    } else {
      invalid.push(trimmed);
    }
  }
  return { tokens, invalid };
}

/** Every color token of `theme` with `tokens` on top, as custom properties. */
export function previewStyle(theme: CarbonTheme, tokens: Tokens) {
  const values: Record<string, string> = {};
  for (const [token, byTheme] of Object.entries(baseTokens)) {
    // A contextual token such as `layer` points at its first-layer token, as
    // all.css does, so an override of `layer-01` reaches it.
    const level = ["00", "01"].find(
      (n) => baseTokens[`${token}-${n}`]?.[theme] === byTheme[theme],
    );
    values[token] = level ? `var(--cds-${token}-${level})` : byTheme[theme];
  }
  Object.assign(values, tokens);
  return Object.entries(values)
    .map(([token, value]) => `--cds-${token}: ${value};`)
    .join(" ");
}

function objectLines(tokens: Tokens, indent: string) {
  return Object.entries(tokens).map(
    ([token, value]) =>
      `${indent}${BARE_KEY.test(token) ? token : JSON.stringify(token)}: ${JSON.stringify(value)},`,
  );
}

export function themeSnippet(theme: CarbonTheme, tokens: Tokens) {
  return [
    "<script>",
    '  import { Theme } from "carbon-components-svelte";',
    `</${"script"}>`,
    "",
    "<Theme",
    `  theme="${theme}"`,
    "  tokens={{",
    ...objectLines(tokens, "    "),
    "  }}",
    "/>",
  ].join("\n");
}

export function createThemeSnippet(
  theme: CarbonTheme,
  brand: string,
  overrides: Tokens,
) {
  const options = [`  theme: "${theme}",`, `  brand: "${brand}",`];
  if (Object.keys(overrides).length > 0) {
    options.push("  tokens: {", ...objectLines(overrides, "    "), "  },");
  }
  return [
    'import { createTheme } from "carbon-components-svelte";',
    "",
    "const { tokens, warnings } = createTheme({",
    ...options,
    "});",
    "",
    `// <Theme theme="${theme}" {tokens} />`,
  ].join("\n");
}
