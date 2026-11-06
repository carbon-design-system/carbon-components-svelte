/**
 * Full-text search over the site's search index: components and their h2
 * sections. BM25+ over `text` and `description` (boosted 2×), as MiniSearch
 * scored it, with each query word scored by its best match in a field: a
 * word or a part of a camel-case name, exactly, as a prefix, or within one
 * edit for every ten letters. A document matching more of the query's
 * words ranks higher, and equal scores keep the index's order.
 */

export type SearchDocument = {
  id: string;
  text: string;
  description: string;
  href: string;
  isComponent: boolean;
};

const WORD_SEPARATOR_RE = /[\n\r\p{Z}\p{P}]+/u;
const FIELDS = ["text", "description"] as const;
const FIELD_BOOSTS = [1, 2];

// BM25+ parameters and match weights, MiniSearch's defaults.
const K = 1.2;
const B = 0.7;
const D = 0.5;
const PREFIX_WEIGHT = 0.375;
const FUZZY_WEIGHT = 0.45;
/** Edits allowed per letter of a query term, rounded: one from 5 letters. */
const FUZZINESS = 0.1;

/** Levenshtein distance between `a` and `b`, or `max + 1` once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
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
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
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
  const averageFieldLengths = FIELDS.map(() => 0);

  documents.forEach((document, doc) => {
    fieldLengths[doc] = FIELDS.map((field, f) => {
      const tokens = indexWords(document[field]);
      const length = new Set(tokens).size;
      // A running mean, as MiniSearch keeps it, so scores tie as they did.
      averageFieldLengths[f] =
        (averageFieldLengths[f] * doc + length) / (doc + 1);
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
          1 + (documents.length - docs.size + 0.5) / (docs.size + 0.5),
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
    const maxDistance = Math.round(term.length * FUZZINESS);
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
