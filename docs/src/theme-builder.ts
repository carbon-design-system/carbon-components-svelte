import type { CarbonTheme } from "carbon-components-svelte/tokens";
import { colorTokens, componentTokens } from "carbon-components-svelte/tokens";
import {
  colorGroups,
  componentGroups,
  scaleGroups,
  typeGroups,
} from "./token-reference";

/** Token values keyed by token name, such as `layer-01`. */
type Tokens = Partial<Record<string, string>>;

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

/** A token the builder can override, with the CSS property that checks it. */
export type EditableRow = {
  name: string;
  property: string;
  base: Record<CarbonTheme, string> | string;
};

export type EditableGroup = { id: string; label: string; rows: EditableRow[] };

/**
 * Every token that components read: all colors, then the type and spacing
 * tokens. Fluid type and the layout, container and size scales are left
 * out, because no component CSS reads them.
 */
export const editableGroups: EditableGroup[] = [
  ...[...colorGroups, ...componentGroups].map((group) => ({
    id: group.id,
    label: group.label,
    rows: group.rows.map((row) => ({
      name: row.name,
      property: "color",
      base: row.values,
    })),
  })),
  ...typeGroups
    .filter((group) => group.id !== "type-fluid")
    .map((group) => ({
      id: group.id,
      label: `${group.label} type`,
      rows: group.rows.flatMap((row) =>
        Object.entries(row.style).map(([property, value]) => ({
          name: `${row.name}-${property}`,
          property,
          base: value,
        })),
      ),
    })),
  {
    id: "spacing",
    label: "Spacing",
    rows: scaleGroups[0].rows
      .filter((row) => row.name.startsWith("spacing-"))
      .map((row) => ({ name: row.name, property: "padding", base: row.value })),
  },
];

const editableNames = new Set(
  editableGroups.flatMap((group) => group.rows.map((row) => row.name)),
);

const OVERRIDE_LINE = /^(?:--cds-)?([a-z0-9-]+)\s*:\s*(.+?);?$/;
const BARE_KEY = /^[a-z]\w*$/i;

export function parseOverrides(text: string) {
  const tokens: Tokens = {};
  const invalid: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [, token, value] = trimmed.match(OVERRIDE_LINE) ?? [];
    if (token && editableNames.has(token)) {
      tokens[token] = value;
    } else {
      invalid.push(trimmed);
    }
  }
  return { tokens, invalid };
}

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
  // Labels such as Checkbox and RadioButton inherit their color, so set it
  // here, or they keep the page theme's text color.
  return Object.entries(values)
    .map(([token, value]) => `--cds-${token}: ${value};`)
    .concat("color: var(--cds-text-primary);")
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

/** URL parameters that hold a theme builder state, for a shareable link. */
export type BuilderState = {
  theme: CarbonTheme;
  brand: string;
  overrides: string;
};

/**
 * Writes `theme=g10&brand=501214&tokens=text-primary:363534;layer-01:f5f1ee`.
 * Hex values drop their `#`, and `:`, `;` and `,` stay unescaped, so the
 * link stays readable.
 */
export function serializeBuilderState(state: BuilderState) {
  const hex = (value: string) => value.trim().replace(/^#(?=[0-9a-f]+$)/i, "");
  const tokens = state.overrides
    .split("\n")
    .map((line) => line.trim().replace(/;$/, ""))
    .filter(Boolean)
    .map((line) => {
      const [token, ...value] = line.split(":");
      return `${token.trim()}:${hex(value.join(":"))}`;
    })
    .join(";");
  const params: [string, string][] = [
    ["theme", state.theme],
    ["brand", hex(state.brand)],
  ];
  if (tokens) params.push(["tokens", tokens]);
  return params
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(value).replace(/%(3A|3B|2C)/gi, (code) => decodeURIComponent(code))}`,
    )
    .join("&");
}

/** Reads the state that `serializeBuilderState` wrote. Unknown values drop. */
export function parseBuilderState(
  params: URLSearchParams,
  themes: readonly CarbonTheme[],
): Partial<BuilderState> {
  const hex = (value: string) =>
    /^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value) ? `#${value}` : value;
  const state: Partial<BuilderState> = {};
  const theme = params.get("theme");
  if (theme && themes.includes(theme as CarbonTheme)) {
    state.theme = theme as CarbonTheme;
  }
  const brand = params.get("brand")?.trim();
  if (brand) state.brand = hex(brand.replace(/^#/, ""));
  const tokens = params.get("tokens");
  if (tokens) {
    state.overrides = tokens
      .split(";")
      .map((pair) => {
        const [token, ...value] = pair.split(":");
        return token.trim() && value.length
          ? `${token.trim()}: ${hex(value.join(":").trim())}`
          : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return state;
}
