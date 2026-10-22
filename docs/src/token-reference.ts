import type {
  CarbonTheme,
  ColorToken,
  ComponentToken,
  TypeStyle,
  TypeToken,
} from "carbon-components-svelte/tokens";
import {
  colorTokens,
  componentTokens,
  containerTokens,
  layoutTokens,
  sizeTokens,
  spacingTokens,
  typeTokens,
} from "carbon-components-svelte/tokens";

const REM_RE = /^(-?[\d.]+)rem$/;
const WHITESPACE_RE = /\s+/g;
const VAR_RE = /^var\((.*)\)$/;
const CDS_PREFIX_RE = /^--cds-/;
const SASS_PREFIX_RE = /^\$/;

export const TOKEN_THEMES: CarbonTheme[] = [
  "white",
  "g10",
  "g80",
  "g90",
  "g100",
];

/**
 * A group matches a token whose name is `prefix` or starts with `prefix-`,
 * or that is listed in `names`.
 */
export interface TokenGroupDefinition {
  id: string;
  label: string;
  description: string;
  prefix?: string;
  names?: string[];
}

export interface ColorRow {
  name: string;
  values: Record<CarbonTheme, string>;
}

export interface TokenGroup<Row> {
  id: string;
  label: string;
  description: string;
  rows: Row[];
}

export interface TypeRow {
  name: TypeToken;
  style: TypeStyle;
}

export interface ScaleRow {
  name: string;
  value: string;
}

/** Color groups, in the order Carbon's color token tables use. */
export const COLOR_GROUPS: TokenGroupDefinition[] = [
  {
    id: "background",
    label: "Background",
    description:
      "The page background, and its hover, active and selected states.",
    prefix: "background",
  },
  {
    id: "layer",
    label: "Layer",
    description:
      "Surfaces on top of the background, such as tiles and menus. Numbered tokens set the layer level.",
    prefix: "layer",
  },
  {
    id: "field",
    label: "Field",
    description: "Backgrounds of form inputs, by layer level.",
    prefix: "field",
  },
  {
    id: "border",
    label: "Border",
    description: "Dividers, outlines and the borders of controls.",
    prefix: "border",
  },
  {
    id: "text",
    label: "Text",
    description: "Body copy, labels, helper text and placeholders.",
    prefix: "text",
  },
  {
    id: "link",
    label: "Link",
    description: "Links and their hover, active and visited states.",
    prefix: "link",
  },
  {
    id: "icon",
    label: "Icon",
    description: "Icon fills.",
    prefix: "icon",
  },
  {
    id: "support",
    label: "Support",
    description:
      "Status colors for errors, warnings, success, information and caution.",
    prefix: "support",
  },
  {
    id: "focus",
    label: "Focus",
    description: "Focus rings, including the inset and inverse variants.",
    prefix: "focus",
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    description:
      "Interactive accents, highlights, overlays, toggles and shadows.",
    names: ["interactive", "highlight", "overlay", "toggle-off", "shadow"],
  },
  {
    id: "skeleton",
    label: "Skeleton",
    description: "Loading placeholders.",
    prefix: "skeleton",
  },
  {
    id: "ai",
    label: "AI",
    description: "The AI label, aura, borders, popovers and skeletons.",
    prefix: "ai",
  },
  {
    id: "chat",
    label: "Chat",
    description:
      "The chat shell, header, bubbles, avatars, buttons and prompt.",
    prefix: "chat",
  },
];

export const COMPONENT_GROUPS: TokenGroupDefinition[] = [
  {
    id: "button",
    label: "Button",
    description: "Button fills by kind, and their hover and active states.",
    prefix: "button",
  },
  {
    id: "tag",
    label: "Tag",
    description: "Tag backgrounds, text, hover and border colors, by tag type.",
    prefix: "tag",
  },
  {
    id: "notification",
    label: "Notification",
    description:
      "Notification backgrounds by kind, and the action button colors.",
    prefix: "notification",
  },
  {
    id: "content-switcher",
    label: "Content switcher",
    description: "The low contrast switcher's container, hover and selection.",
    prefix: "content-switcher",
  },
  {
    id: "status",
    label: "Status",
    description: "Status indicator fills and outlines, by color.",
    prefix: "status",
  },
];

export const TYPE_GROUPS: TokenGroupDefinition[] = [
  {
    id: "type-utility",
    label: "Utility",
    description: "Labels, helper text, legal copy and code.",
    names: [
      "label-01",
      "label-02",
      "helper-text-01",
      "helper-text-02",
      "legal-01",
      "legal-02",
      "code-01",
      "code-02",
    ],
  },
  {
    id: "type-body",
    label: "Body",
    description: "Running text. Compact styles have a tighter line height.",
    prefix: "body",
  },
  {
    id: "type-heading",
    label: "Heading",
    description: "Fixed headings. Compact styles have a tighter line height.",
    prefix: "heading",
  },
  {
    id: "type-fluid",
    label: "Fluid",
    description:
      "Headings, paragraphs, quotations and display styles that grow with the viewport. The values are for the smallest breakpoint.",
    prefix: "fluid",
  },
];

export function groupMatches(group: TokenGroupDefinition, name: string) {
  if (group.names?.includes(name)) return true;
  if (!group.prefix) return false;
  return name === group.prefix || name.startsWith(`${group.prefix}-`);
}

/**
 * Sorts `names` into `groups`, keeping each name's order. Returns the names
 * no group matched, so a new token can't go missing from the page.
 */
export function groupNames(
  groups: TokenGroupDefinition[],
  names: string[],
): { groups: Map<string, string[]>; ungrouped: string[] } {
  const result = new Map(groups.map((group) => [group.id, [] as string[]]));
  const ungrouped: string[] = [];
  for (const name of names) {
    const group = groups.find((candidate) => groupMatches(candidate, name));
    if (group) result.get(group.id)?.push(name);
    else ungrouped.push(name);
  }
  return { groups: result, ungrouped };
}

function buildGroups<Row>(
  definitions: TokenGroupDefinition[],
  names: string[],
  toRow: (name: string) => Row,
): TokenGroup<Row>[] {
  const { groups, ungrouped } = groupNames(definitions, names);
  const result = definitions.map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    rows: (groups.get(definition.id) ?? []).map(toRow),
  }));
  if (ungrouped.length) {
    result.push({
      id: `${definitions[0].id}-other`,
      label: "Other",
      description: "Tokens without a group yet.",
      rows: ungrouped.map(toRow),
    });
  }
  return result;
}

export const colorGroups = buildGroups(
  COLOR_GROUPS,
  Object.keys(colorTokens),
  (name): ColorRow => ({ name, values: colorTokens[name as ColorToken] }),
);

export const componentGroups = buildGroups(
  COMPONENT_GROUPS,
  Object.keys(componentTokens),
  (name): ColorRow => ({
    name,
    values: componentTokens[name as ComponentToken],
  }),
);

export const typeGroups = buildGroups(
  TYPE_GROUPS,
  Object.keys(typeTokens),
  (name): TypeRow => ({
    name: name as TypeToken,
    style: typeTokens[name as TypeToken],
  }),
);

function scaleRows(tokens: Record<string, string>): ScaleRow[] {
  return Object.entries(tokens).map(([name, value]) => ({ name, value }));
}

export const scaleGroups: TokenGroup<ScaleRow>[] = [
  {
    id: "spacing",
    label: "Spacing",
    description:
      "Space between and inside elements. Fluid spacing scales with the viewport width.",
    rows: scaleRows(spacingTokens),
  },
  {
    id: "layout",
    label: "Layout",
    description: "Space between larger regions of a page.",
    rows: scaleRows(layoutTokens),
  },
  {
    id: "container",
    label: "Container",
    description: "Heights of containers such as buttons and inputs.",
    rows: scaleRows(containerTokens),
  },
  {
    id: "size",
    label: "Size",
    description: "Control heights and icon sizes.",
    rows: scaleRows(sizeTokens),
  },
];

export function cssVar(name: string) {
  return `var(--cds-${name})`;
}

export function sassVar(name: string) {
  return `$${name}`;
}

/** Converts a rem value to pixels at a 16px root, or returns `undefined`. */
export function remToPx(value: string) {
  const match = REM_RE.exec(value);
  if (!match) return undefined;
  return `${Number.parseFloat(match[1]) * 16}px`;
}

function compact(value: string) {
  return value.toLowerCase().replace(WHITESPACE_RE, "");
}

/**
 * Normalizes a query so a pasted `var(--cds-layer-01)` or `$layer-01`
 * matches `layer-01`.
 */
export function normalizeQuery(query: string) {
  return compact(query)
    .replace(VAR_RE, "$1")
    .replace(CDS_PREFIX_RE, "")
    .replace(SASS_PREFIX_RE, "");
}

/** Matches a token by name, or by any of its values. */
export function matchesToken(
  query: string,
  name: string,
  values: Iterable<string>,
) {
  if (!query) return true;
  if (name.includes(query)) return true;
  for (const value of values) {
    if (compact(value).includes(query)) return true;
  }
  return false;
}

export function filterGroups<Row extends { name: string }>(
  groups: TokenGroup<Row>[],
  query: string,
  valuesOf: (row: Row) => Iterable<string>,
): TokenGroup<Row>[] {
  if (!query) return groups;
  return groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) =>
        matchesToken(query, row.name, valuesOf(row)),
      ),
    }))
    .filter((group) => group.rows.length > 0);
}
