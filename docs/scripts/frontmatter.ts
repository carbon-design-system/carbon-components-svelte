const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

export type Frontmatter = {
  components?: string[];
  description?: string;
  /** Other words readers search for the page by, such as `chip` for Tag. */
  keywords?: string[];
};

export function splitFrontmatter(source: string) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

/** The front matter's YAML, as an object. */
export function parseFrontmatter(yaml: string): Record<string, unknown> {
  const data = Bun.YAML.parse(yaml);
  if (data === null || data === undefined) return {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Front matter must be a YAML mapping");
  }
  return data as Record<string, unknown>;
}

export function readFrontmatter(source: string, filePath: string): Frontmatter {
  const { frontmatter } = splitFrontmatter(source);
  if (!frontmatter) return {};
  try {
    return parseFrontmatter(frontmatter) as Frontmatter;
  } catch (error) {
    throw new Error(`${filePath}: invalid frontmatter`, { cause: error });
  }
}
