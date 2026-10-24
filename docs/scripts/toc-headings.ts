export type TocHeading = { id: string; text: string; depth: 2 | 3 };

const HEADING_RE = /<h([23])[^>]+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
const HEADING_ANCHOR_TAG_RE =
  /<a\b[^>]*\bclass="heading-anchor"[^>]*>[\s\S]*?<\/a\s*>/g;
const TAG_RE = /<[^>]+>/g;
const ENTITY_RE = /&(?:#x([\da-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi;
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(ENTITY_RE, (_, hex, dec, name) =>
    hex
      ? String.fromCodePoint(Number.parseInt(hex, 16))
      : dec
        ? String.fromCodePoint(Number(dec))
        : NAMED_ENTITIES[name.toLowerCase()],
  );
}

/** The slugged h2/h3 headings in rendered page HTML, as plain text, for the table of contents. */
export function tocHeadings(html: string): TocHeading[] {
  return Array.from(html.matchAll(HEADING_RE), (match) => ({
    id: match[2],
    text: decodeEntities(
      match[3].replace(HEADING_ANCHOR_TAG_RE, "").replace(TAG_RE, ""),
    ).trim(),
    depth: Number(match[1]) as 2 | 3,
  }));
}
