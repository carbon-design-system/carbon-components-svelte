/**
 * Lines between `docs-only:start` and `docs-only:end` markers (as `//` or
 * `<!-- -->` comments), inclusive. They run in the framed example but are
 * dropped from the displayed source, for docs-site workarounds that readers
 * should not copy.
 */
const DOCS_ONLY_BLOCK_RE =
  /^[ \t]*(?:\/\/|<!--)[ \t]*docs-only:start\b[\s\S]*?^[ \t]*(?:\/\/|<!--)[ \t]*docs-only:end\b.*(?:\r?\n|$)/gm;
const EXTRA_BLANK_LINES_RE = /\n{3,}/g;

export function stripDocsOnly(source: string): string {
  const stripped = source.replace(DOCS_ONLY_BLOCK_RE, "");
  if (stripped === source) return source;
  // A block set off by blank lines on both sides leaves two in a row.
  return stripped.replace(EXTRA_BLANK_LINES_RE, "\n\n");
}
