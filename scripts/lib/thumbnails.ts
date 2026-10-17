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
  "text-03": "#a8a8a8",
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

/** The parts of a `carbon.yml` asset that `auditCatalog` reads. */
export interface CatalogAsset {
  name?: string;
  thumbnailPath?: string;
  demoLinks?: { url?: string }[];
}

/**
 * Docs pages deliberately left out of `carbon.yml`. Empty for now; add a
 * page here, and to thumbnails/README.md, only when the maintainers decide
 * it doesn't belong in the catalog.
 */
export const UNCATALOGED_PAGES = new Set<string>();

const DOCS_PAGE_URL = /\/components\/([A-Za-z]+)/;
const THUMBNAIL_PATH = /^\.\/thumbnails\/([a-z0-9-]+)\.svg$/;
const ACRONYM = /^[A-Z0-9]{2,}$/;
const LEADING_WORD = /^[A-Z][a-z0-9]*$/;
const LOWER_WORD = /^[a-z0-9]+$/;

/**
 * Carbon's sentence case: the first letter upper case, the rest lower case,
 * except all-caps acronyms ("UI shell header", "PIN code input").
 */
export function isSentenceCase(name: string): boolean {
  return name
    .split(" ")
    .every(
      (word, i) =>
        ACRONYM.test(word) || (i === 0 ? LEADING_WORD : LOWER_WORD).test(word),
    );
}

const sortedWords = (words: string[]) => words.sort().join(" ");

/**
 * Whether a display name spells its key or its docs page: "Tooltip icon"
 * for `tooltip-icon`, "Multiselect" for MultiSelect. Word order is free,
 * so "Vertical tabs" matches `tabs-vertical`; a misspelling like "Tootlip
 * icon" matches neither.
 */
function nameMatches(name: string, key: string, page?: string): boolean {
  const words = name.toLowerCase().split(" ");
  const spellings = [key.replaceAll("-", ""), page?.toLowerCase()];
  return (
    spellings.includes(words.join("")) ||
    sortedWords(words) === sortedWords(key.split("-"))
  );
}

/**
 * Checks `carbon.yml` assets against the docs pages and thumbnails: every
 * page has an asset, every asset's thumbnail exists, every thumbnail is
 * used, and every `name` is sentence case and spells its component. Assets
 * without a `name` inherit it from `carbon-styles` and aren't checked.
 */
export function auditCatalog(
  assets: Record<string, CatalogAsset>,
  pageNames: string[],
  thumbnailNames: string[],
): string[] {
  const problems: string[] = [];
  const thumbnails = new Set(thumbnailNames);
  const catalogedPages = new Set<string>();
  const usedThumbnails = new Set<string>();

  for (const [key, asset] of Object.entries(assets)) {
    const page = asset.demoLinks
      ?.map((link) => link.url?.match(DOCS_PAGE_URL)?.[1])
      .find(Boolean);
    if (page) catalogedPages.add(page);

    const thumbnail = asset.thumbnailPath?.match(THUMBNAIL_PATH)?.[1];
    if (thumbnail) usedThumbnails.add(thumbnail);
    if (!thumbnail || !thumbnails.has(thumbnail)) {
      problems.push(
        `${key}: thumbnailPath ${asset.thumbnailPath ?? "(none)"} is not a file in thumbnails/`,
      );
    }

    if (asset.name === undefined) continue;
    if (!isSentenceCase(asset.name)) {
      problems.push(`${key}: name "${asset.name}" is not sentence case`);
    }
    if (!nameMatches(asset.name, key, page)) {
      problems.push(
        `${key}: name "${asset.name}" doesn't spell the key or ${page ?? "its docs page"}`,
      );
    }
  }

  for (const page of pageNames) {
    if (!catalogedPages.has(page) && !UNCATALOGED_PAGES.has(page)) {
      problems.push(`${page} has no carbon.yml asset`);
    }
  }
  for (const thumbnail of thumbnailNames) {
    if (!usedThumbnails.has(thumbnail)) {
      problems.push(`thumbnails/${thumbnail}.svg has no carbon.yml asset`);
    }
  }

  return problems;
}
