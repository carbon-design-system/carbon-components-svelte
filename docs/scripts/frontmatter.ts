const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

/** The fields a docs page's front matter sets. */
export type Frontmatter = {
  /** The components the page documents. */
  components?: string[];
  /** A one-sentence summary of the page. */
  description?: string;
};

/** A page's front matter, unparsed, and the rest of the page. */
export function splitFrontmatter(source: string) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

/**
 * A page's front matter. Parses with `Bun.YAML`, a strict YAML 1.2
 * parser, so front matter that only mdsvex's lenient parser accepts fails
 * the build.
 */
export function readFrontmatter(source: string, filePath: string): Frontmatter {
  const { frontmatter } = splitFrontmatter(source);
  if (!frontmatter) return {};
  try {
    return (Bun.YAML.parse(frontmatter) as Frontmatter | null) ?? {};
  } catch (error) {
    throw new Error(`${filePath}: invalid frontmatter`, { cause: error });
  }
}
