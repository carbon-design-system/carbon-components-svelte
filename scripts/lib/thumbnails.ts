/**
 * Rules for the catalog thumbnails in thumbnails/, kept free of file I/O so
 * they are unit-testable. scripts/thumbnails.ts feeds these the docs pages
 * and SVG sources. thumbnails/README.md explains the design side.
 */

/** Allowed `var(--cds-<token>, <hex>)` pairs; the hex is the white-theme value. */
export const THUMBNAIL_TOKENS: Record<string, string> = {
  "ui-02": "#ffffff",
  "field-01": "#f4f4f4",
  "border-subtle": "#e0e0e0",
  "text-disabled": "#c6c6c6",
  "text-placeholder": "#a8a8a8",
  "border-strong": "#8d8d8d",
  "text-secondary": "#525252",
  "button-secondary": "#393939",
  "icon-primary": "#161616",
  "icon-inverse": "#ffffff",
  "text-04": "#ffffff",
  "interactive-01": "#0f62fe",
  "support-success": "#198038",
  "support-warning": "#f1c21b",
  "support-error": "#da1e28",
  "background-inverse": "#393939",
  "text-inverse": "#ffffff",
};

/**
 * Thumbnails whose idea is a set of literal colors (tag colors, avatar
 * colors, theme swatches), so raw hex fills are expected.
 */
export const RAW_COLOR_EXCEPTIONS = new Set([
  "tag",
  "tag-set",
  "theme",
  "user-avatar-group",
]);

/**
 * Thumbnails with no docs page of their own: `tabs-vertical` backs the
 * `carbon.yml` entry for TabsVertical, which is documented on the Tabs page.
 */
export const PAGELESS_THUMBNAILS = new Set(["tabs-vertical"]);

export const THUMBNAIL_SIZE_BUDGET = 8_000;

const UI_SHELL = /UIShell/;
const CASE_BOUNDARY = /([a-z0-9])([A-Z])/g;
const CANVAS_SIZE = /<svg[^>]*\bwidth="320px"[^>]*\bheight="180px"/;
const TOKEN_VAR = /var\(--cds-([a-z0-9-]+),\s*([^)]+)\)/g;
const ELEMENT_TAG = /<[a-zA-Z][^>]*>/g;
const FILTER_ATTRIBUTE = /\bfilter="url\(/;
const DEFS_BLOCK = /<defs>[\s\S]*?<\/defs>/;
const ID_ATTRIBUTE = /\bid="([^"]+)"/g;
const ID_REFERENCE = /(url\(#|href="#)([^)"]+)/g;
const REFERENCE_ELEMENT = /xlink:href|<use\b|<image\b/;

/** `ToggleButtonGroup` → `toggle-button-group`, `UIShell` → `ui-shell`. */
export function thumbnailName(pageName: string): string {
  return pageName
    .replace(UI_SHELL, "UiShell")
    .replace(CASE_BOUNDARY, "$1-$2")
    .toLowerCase();
}

export function missingThumbnails(
  pageNames: string[],
  thumbnailNames: string[],
): string[] {
  const existing = new Set(thumbnailNames);
  return pageNames.filter((page) => !existing.has(thumbnailName(page)));
}

/** Thumbnails with neither a docs page nor a `PAGELESS_THUMBNAILS` entry. */
export function orphanThumbnails(
  pageNames: string[],
  thumbnailNames: string[],
): string[] {
  const expected = new Set(pageNames.map(thumbnailName));
  return thumbnailNames.filter(
    (name) => !expected.has(name) && !PAGELESS_THUMBNAILS.has(name),
  );
}

const ATTRIBUTE_COLOR = /\b(fill|stroke|stop-color)="([^"]*)"/g;
const NON_COLOR_VALUES = new Set(["none", "currentColor", "transparent"]);

export function auditThumbnail(name: string, svg: string): string[] {
  const problems: string[] = [];

  if (!CANVAS_SIZE.test(svg) || !svg.includes('viewBox="0 0 320 180"')) {
    problems.push(
      'canvas is not width="320px" height="180px" viewBox="0 0 320 180"',
    );
  }

  for (const [, token, hex] of svg.matchAll(TOKEN_VAR)) {
    const expected = THUMBNAIL_TOKENS[token];
    if (!expected) {
      problems.push(`token --cds-${token} is not in the token table`);
    } else if (hex.trim().toLowerCase() !== expected) {
      problems.push(
        `token --cds-${token} falls back to ${hex}, not ${expected}`,
      );
    }
  }

  if (!RAW_COLOR_EXCEPTIONS.has(name)) {
    for (const element of svg.match(ELEMENT_TAG) ?? []) {
      for (const [, attribute, value] of element.matchAll(ATTRIBUTE_COLOR)) {
        if (
          value.startsWith("var(") ||
          value.startsWith("url(") ||
          NON_COLOR_VALUES.has(value)
        ) {
          continue;
        }
        // The elevation recipe draws its shadow in black under a filter.
        if (value === "black" && FILTER_ATTRIBUTE.test(element)) continue;
        problems.push(`raw color ${attribute}="${value}"`);
      }
    }
  }

  const defs = svg.match(DEFS_BLOCK)?.[0] ?? "";
  const sharedIds = [
    ...[...defs.matchAll(ID_ATTRIBUTE)].map(([, id]) => id),
    ...[...svg.matchAll(ID_REFERENCE)].map(([, , id]) => id),
  ];
  for (const id of sharedIds) {
    if (!id.startsWith(`${name}-`)) {
      problems.push(
        `id "${id}" is referenced or defined in <defs> but not prefixed with "${name}-"`,
      );
    }
  }

  if (REFERENCE_ELEMENT.test(svg)) {
    problems.push("uses <use>, <image>, or xlink:href; draw plain shapes");
  }

  const size = new TextEncoder().encode(svg).length;
  if (size > THUMBNAIL_SIZE_BUDGET) {
    problems.push(`${size} B exceeds the ${THUMBNAIL_SIZE_BUDGET} B budget`);
  }

  return [...new Set(problems)];
}
