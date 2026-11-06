/**
 * Full-text search over the site's search index: components and their h2
 * sections. BM25+ over each field, as MiniSearch scored it, with each
 * query word scored by its best match in a field: a word or a part of a
 * camel-case name, exactly, as a prefix, or from 4 letters, one edit
 * away, a swap of two letters included. A document matching more of the
 * query's words ranks higher, and equal scores keep the index's order.
 */

export type SearchDocument = {
  id: string;
  text: string;
  description: string;
  /** A component page's summary, its front matter's `description`. */
  summary?: string;
  href: string;
  isComponent: boolean;
};

const WORD_SEPARATOR_RE = /[\n\r\p{Z}\p{P}]+/u;
const FIELDS = ["text", "description", "summary"] as const;
/**
 * The heading counts twice the component's name. A page's summary counts
 * half: it catches other words for a component, such as "spinner" for
 * Loading, but mentions many things a page isn't about.
 */
const FIELD_BOOSTS = [1, 2, 0.5];

// BM25+ parameters and match weights, MiniSearch's defaults.
const K = 1.2;
const B = 0.7;
const D = 0.5;
const PREFIX_WEIGHT = 0.375;
const FUZZY_WEIGHT = 0.45;
/** A query word of 4 letters or more matches a word one edit away. */
const MIN_FUZZY_LENGTH = 4;

/**
 * Edits between `a` and `b`, counting an insertion, deletion, substitution
 * or swap of two neighbors as one, or `max + 1` once it exceeds `max`.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      if (j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        current[j] = Math.min(current[j], beforePrevious[j - 2] + 1);
      }
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    beforePrevious = previous;
    previous = current;
  }
  return previous[b.length];
}

function words(text: string): string[] {
  return text.split(WORD_SEPARATOR_RE);
}

/** A capitalized run, a word, or digits: `UIShell` → `UI`, `Shell`. */
const SUBWORD_RE = /\p{Lu}+(?!\p{Ll})|\p{Lu}?\p{Ll}+|\p{N}+/gu;

/**
 * A field's words, each followed by its parts if it joins several, so
 * `table` finds `DataTable`.
 */
function indexWords(text: string): string[] {
  return words(text).flatMap((word) => {
    const parts = word.match(SUBWORD_RE) ?? [];
    return parts.length > 1 ? [word, ...parts] : [word];
  });
}

export function createSearch<T extends SearchDocument>(documents: T[]) {
  /** Word → per field, the documents that have it and how often. */
  const index = new Map<string, Map<number, number>[]>();
  /** Per document, the number of distinct words in each field. */
  const fieldLengths: number[][] = [];
  /** Per field, the number of documents that have it. */
  const fieldCounts = FIELDS.map(() => 0);
  const averageFieldLengths = FIELDS.map(() => 0);

  documents.forEach((document, doc) => {
    fieldLengths[doc] = FIELDS.map((field, f) => {
      const text = document[field];
      if (text === undefined) return 0;
      const tokens = indexWords(text);
      const length = new Set(tokens).size;
      const count = fieldCounts[f]++;
      // A running mean, as MiniSearch keeps it, so scores tie as they did.
      averageFieldLengths[f] =
        (averageFieldLengths[f] * count + length) / (count + 1);
      for (const token of tokens) {
        const word = token.toLowerCase();
        if (!word) continue;
        let fields = index.get(word);
        if (!fields) index.set(word, (fields = FIELDS.map(() => new Map())));
        fields[f].set(doc, (fields[f].get(doc) ?? 0) + 1);
      }
      return length;
    });
  });

  /**
   * Per document, the best score `term` reaches in each field: matching
   * a word exactly, as its prefix, or within a few edits. Only the best
   * match counts, so `button` doesn't score `ButtonSet` for both `button`
   * and `buttonset`.
   */
  function searchTerm(term: string): Map<number, number[]> {
    const best = new Map<number, number[]>();
    const match = (word: string, weight: number) => {
      index.get(word)?.forEach((docs, f) => {
        const idf = Math.log(
          1 + (fieldCounts[f] - docs.size + 0.5) / (docs.size + 0.5),
        );
        for (const [doc, frequency] of docs) {
          const lengthRatio = fieldLengths[doc][f] / averageFieldLengths[f];
          const bm25 =
            idf *
            (D +
              (frequency * (K + 1)) /
                (frequency + K * (1 - B + B * lengthRatio)));
          const score = weight * FIELD_BOOSTS[f] * bm25;
          let scores = best.get(doc);
          if (!scores) best.set(doc, (scores = FIELDS.map(() => 0)));
          scores[f] = Math.max(scores[f], score);
        }
      });
    };

    match(term, 1);
    const maxDistance = term.length >= MIN_FUZZY_LENGTH ? 1 : 0;
    for (const word of index.keys()) {
      if (word === term) continue;
      if (word.startsWith(term)) {
        const distance = word.length - term.length;
        match(
          word,
          (PREFIX_WEIGHT * word.length) / (word.length + 0.3 * distance),
        );
      } else if (maxDistance > 0) {
        const distance = editDistance(term, word, maxDistance);
        if (distance <= maxDistance) {
          match(word, (FUZZY_WEIGHT * word.length) / (word.length + distance));
        }
      }
    }
    return best;
  }

  /**
   * Documents matching any word of `query`, best first: each matched word
   * adds its score, and the total is multiplied by the number of words
   * matched.
   */
  return function search(query: string): T[] {
    const terms = new Set(
      words(query)
        .map((word) => word.toLowerCase())
        .filter(Boolean),
    );
    const hits = new Map<number, { score: number; terms: number }>();
    for (const term of terms) {
      for (const [doc, scores] of searchTerm(term)) {
        const score = scores.reduce((sum, s) => sum + s, 0);
        const hit = hits.get(doc);
        if (hit) {
          hit.score += score;
          hit.terms++;
        } else {
          hits.set(doc, { score, terms: 1 });
        }
      }
    }
    return (
      Array.from(hits, ([doc, hit]) => ({ doc, score: hit.score * hit.terms }))
        // Equal scores keep the index's order: components, then their
        // sections as the page has them.
        .sort((a, b) => b.score - a.score || a.doc - b.doc)
        .map(({ doc }) => documents[doc])
    );
  };
}
