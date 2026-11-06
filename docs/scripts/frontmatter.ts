const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

/** The fields a docs page's front matter sets. */
export type Frontmatter = {
  /** The components the page documents. */
  components?: string[];
  /** A one-sentence summary of the page. */
  description?: string;
  /** Other words readers search for the page by, such as `chip` for Tag. */
  keywords?: string[];
};

/** A page's front matter, unparsed, and the rest of the page. */
export function splitFrontmatter(source: string) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

/** The YAML the pages' front matter uses: plain scalars and `[...]` lists of quoted strings. */
export function parseFrontmatter(yaml: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^([A-Za-z_][\w-]*):(?:[ \t]+(.*))?$/.exec(lines[i]);
    if (!match) {
      if (/^\s*(#.*)?$/.test(lines[i])) continue;
      throw new Error(`Unsupported front matter: ${JSON.stringify(lines[i])}`);
    }
    const [, key, rest = ""] = match;
    let value = rest.trim();
    if (value === "" || value.startsWith("[")) {
      while (!value.includes("]") && i + 1 < lines.length) {
        value += ` ${lines[++i].trim()}`;
      }
      data[key] = Array.from(
        value.matchAll(/"((?:[^"\\]|\\.)*)"/g),
        ([quoted]) => JSON.parse(quoted) as string,
      );
    } else if (value.startsWith('"')) {
      data[key] = JSON.parse(value);
    } else {
      data[key] = value;
    }
  }
  return data;
}

/** A page's front matter, read as the page compiler reads it. */
export function readFrontmatter(source: string, filePath: string): Frontmatter {
  const { frontmatter } = splitFrontmatter(source);
  if (!frontmatter) return {};
  try {
    return parseFrontmatter(frontmatter) as Frontmatter;
  } catch (error) {
    throw new Error(`${filePath}: invalid frontmatter`, { cause: error });
  }
}
