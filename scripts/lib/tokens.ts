/**
 * Builds the `carbon-components-svelte/tokens` module from the compiled
 * `all.css` and Carbon's generated token list. Kept free of file and Sass I/O
 * so the css tests can rebuild it from their cached compile and compare.
 *
 * Only Carbon v10 names are exported. The token list also carries v11 color
 * and type names and deprecated aliases; `all.css` declares some of them,
 * but they stay CSS-only.
 */

export const TOKENS_SCSS =
  "css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/themes/generated/_tokens.scss";

export const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

type Theme = (typeof THEMES)[number];
type Declarations = Record<string, string>;

const TYPE_PROPERTIES = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
] as const;

export type TokenData = {
  color: Record<string, Record<Theme, string>>;
  component: Record<string, Record<Theme, string>>;
  type: Record<
    string,
    Partial<Record<(typeof TYPE_PROPERTIES)[number], string>>
  >;
  spacing: Record<string, string>;
  layout: Record<string, string>;
  container: Record<string, string>;
  size: Record<string, string>;
  descriptions: Record<string, string>;
};

type TokenListEntry = { name: string; description?: string };

const DOC_COMMENT = /^\/\/\/ ?(.*)$/;
const VARIABLE = /^\$([a-z0-9-]+):/;
const ROOT_BLOCK = /:root(?:\[theme=["']?(\w+)["']?\])?\s*\{([^}]*)\}/g;
const DECLARATION = /--cds-([\w-]+)\s*:\s*([^;]+)/g;
const COMPONENT = /^(tag|notification)-/;

/** Theme-invariant scales, matched by name. */
const SCALES: [RegExp, "spacing" | "layout" | "container" | "size"][] = [
  [/^(fluid-)?spacing-/, "spacing"],
  [/^layout-/, "layout"],
  [/^container-/, "container"],
  [/^(icon-)?size-/, "size"],
];

/** Token names in Carbon's order, with the `///` description when present. */
function parseTokenList(scss: string): TokenListEntry[] {
  const entries: TokenListEntry[] = [];
  let comment: string[] = [];
  let deprecated = false;
  for (const line of scss.split("\n")) {
    const doc = line.match(DOC_COMMENT);
    if (doc) {
      if (doc[1].startsWith("@deprecated")) deprecated = true;
      else if (!doc[1].startsWith("@")) comment.push(doc[1].trim());
      continue;
    }
    const name = line.match(VARIABLE)?.[1];
    if (name && !deprecated) {
      const description = comment.join(" ").trim();
      entries.push(description ? { name, description } : { name });
    }
    if (name || line.trim() === "") {
      comment = [];
      deprecated = false;
    }
  }
  return entries;
}

/** Slice `names` from `first` through `last`, failing if either is missing. */
function range(names: string[], first: string, last: string): string[] {
  const start = names.indexOf(first);
  const end = names.indexOf(last);
  if (start < 0 || end < start) {
    throw new Error(`token list no longer has ${first} through ${last}`);
  }
  return names.slice(start, end + 1);
}

/** `--cds-*` declarations per theme, with each theme filled in from white. */
function parseThemes(css: string): Record<Theme, Declarations> {
  const declared: Partial<Record<Theme, Declarations>> = {};
  for (const block of css.matchAll(ROOT_BLOCK)) {
    const theme = (block[1] ?? "white") as Theme;
    declared[theme] ??= {};
    const declarations = declared[theme];
    for (const [, name, value] of block[2].matchAll(DECLARATION)) {
      declarations[name] = value.trim();
    }
  }

  const white = declared.white ?? {};
  return Object.fromEntries(
    THEMES.map((theme) => [theme, { ...white, ...declared[theme] }]),
  ) as Record<Theme, Declarations>;
}

export function extractTokens(css: string, tokensScss: string): TokenData {
  const list = parseTokenList(tokensScss);
  const names = list.map((entry) => entry.name);
  const themes = parseThemes(css);
  const white = themes.white;

  const data: TokenData = {
    color: {},
    component: {},
    type: {},
    spacing: {},
    layout: {},
    container: {},
    size: {},
    descriptions: {},
  };

  const perTheme = (name: string) =>
    Object.fromEntries(
      THEMES.map((theme) => [theme, themes[theme][name]]),
    ) as Record<Theme, string>;

  for (const name of range(names, "interactive-01", "skeleton-02")) {
    if (!(name in white)) continue;
    data.color[name] = perTheme(name);
    const description = list.find((entry) => entry.name === name)?.description;
    if (description) data.descriptions[name] = description;
  }

  for (const name of Object.keys(white)) {
    if (COMPONENT.test(name)) data.component[name] = perTheme(name);
  }

  for (const name of range(names, "caption-01", "display-04")) {
    const style: TokenData["type"][string] = {};
    for (const property of TYPE_PROPERTIES) {
      const value = white[`${name}-${property}`];
      if (value !== undefined) style[property] = value;
    }
    if (Object.keys(style).length > 0) data.type[name] = style;
  }

  for (const name of Object.keys(white)) {
    const group = SCALES.find(([pattern]) => pattern.test(name))?.[1];
    if (group) data[group][name] = white[name];
  }

  return data;
}

const HEADER =
  "// Generated by scripts/build-tokens.ts from css/all.scss. Do not edit.";

function union(names: string[]): string {
  return names.map((name) => JSON.stringify(name)).join(" | ");
}

/** The ESM module and its declarations, as written to `src/tokens/`. */
export function renderTokens(data: TokenData): { js: string; dts: string } {
  const json = (value: unknown) => JSON.stringify(value, null, 2);

  const js = `${HEADER}

/** Carbon v10 theme colors, by theme. */
export const colorTokens = ${json(data.color)};

/** Carbon's description of each theme color. */
export const colorTokenDescriptions = ${json(data.descriptions)};

/** Tag and notification colors, by theme. */
export const componentTokens = ${json(data.component)};

/** Carbon v10 type styles. */
export const typeTokens = ${json(data.type)};

/** Spacing scale, including fluid spacing. */
export const spacingTokens = ${json(data.spacing)};

/** Layout scale. */
export const layoutTokens = ${json(data.layout)};

/** Container sizes. */
export const containerTokens = ${json(data.container)};

/** Control and icon sizes. */
export const sizeTokens = ${json(data.size)};
`;

  const dts = `${HEADER}

export type CarbonTheme = ${union([...THEMES])};

export type ColorToken = ${union(Object.keys(data.color))};

export type ComponentToken = ${union(Object.keys(data.component))};

export type TypeToken = ${union(Object.keys(data.type))};

export type TypeStyle = {
  "font-family"?: string;
  "font-size": string;
  "font-weight": string;
  "line-height": string;
  "letter-spacing": string;
};

export type SpacingToken = ${union(Object.keys(data.spacing))};

export type LayoutToken = ${union(Object.keys(data.layout))};

export type ContainerToken = ${union(Object.keys(data.container))};

export type SizeToken = ${union(Object.keys(data.size))};

/** Carbon v10 theme colors, by theme. */
export const colorTokens: Record<ColorToken, Record<CarbonTheme, string>>;

/** Carbon's description of each theme color. */
export const colorTokenDescriptions: Partial<Record<ColorToken, string>>;

/** Tag and notification colors, by theme. */
export const componentTokens: Record<ComponentToken, Record<CarbonTheme, string>>;

/** Carbon v10 type styles. */
export const typeTokens: Record<TypeToken, TypeStyle>;

/** Spacing scale, including fluid spacing. */
export const spacingTokens: Record<SpacingToken, string>;

/** Layout scale. */
export const layoutTokens: Record<LayoutToken, string>;

/** Container sizes. */
export const containerTokens: Record<ContainerToken, string>;

/** Control and icon sizes. */
export const sizeTokens: Record<SizeToken, string>;
`;

  return { js, dts };
}
