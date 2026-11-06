/**
 * Everything GitHub drops from a heading's slug: all but letters, marks,
 * digits, connector punctuation, spaces and hyphens.
 */
const NON_WORD_RE = /[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc} -]/gu;

/** A heading's anchor as GitHub makes it, e.g. `Copy behavior` → `copy-behavior`. */
export function slug(text: string): string {
  return text.toLowerCase().replace(NON_WORD_RE, "").replaceAll(" ", "-");
}

/**
 * Unique slugs for one page's headings: a repeat gets `-1`, `-2` and so on,
 * skipping any a heading already took.
 */
export function createSlugger(): (text: string) => string {
  const occurrences = new Map<string, number>();
  return (text) => {
    const base = slug(text);
    let result = base;
    while (occurrences.has(result)) {
      const count = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, count);
      result = `${base}-${count}`;
    }
    occurrences.set(result, 0);
    return result;
  };
}
