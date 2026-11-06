/**
 * Full-text search over the site's search index: components and their h2
 * sections. Scores as MiniSearch did with the options the site used:
 * BM25+ over `text` and `description` (boosted 2×), each query term
 * matching a word exactly, as a prefix, or within one edit for every ten
 * letters; a document matching more of the terms ranks higher. Equal
 * scores keep the index's order, where MiniSearch's followed its tree.
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

type Hit = { score: number; terms: string[] };

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

export function createSearch<T extends SearchDocument>(documents: T[]) {
  /** Word → per field, the documents that have it and how often. */
  const index = new Map<string, Map<number, number>[]>();
  /** Per document, the number of distinct words in each field. */
  const fieldLengths: number[][] = [];
  const averageFieldLengths = FIELDS.map(() => 0);

  documents.forEach((document, doc) => {
    fieldLengths[doc] = FIELDS.map((field, f) => {
      const tokens = words(document[field]);
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

  function addMatches(
    hits: Map<number, Hit>,
    queryTerm: string,
    word: string,
    weight: number,
  ) {
    const fields = index.get(word);
    if (!fields) return;
    fields.forEach((docs, f) => {
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
        const hit = hits.get(doc);
        if (hit) {
          hit.score += score;
          if (!hit.terms.includes(queryTerm)) hit.terms.push(queryTerm);
        } else {
          hits.set(doc, { score, terms: [queryTerm] });
        }
      }
    });
  }

  function searchTerm(term: string): Map<number, Hit> {
    const hits = new Map<number, Hit>();
    addMatches(hits, term, term, 1);
    const maxDistance = Math.round(term.length * FUZZINESS);
    const fuzzy: [string, number][] = [];
    for (const word of index.keys()) {
      if (word === term) continue;
      if (word.startsWith(term)) {
        const distance = word.length - term.length;
        const weight =
          (PREFIX_WEIGHT * word.length) / (word.length + 0.3 * distance);
        addMatches(hits, term, word, weight);
      } else if (maxDistance > 0) {
        const distance = editDistance(term, word, maxDistance);
        if (distance <= maxDistance) fuzzy.push([word, distance]);
      }
    }
    for (const [word, distance] of fuzzy) {
      const weight = (FUZZY_WEIGHT * word.length) / (word.length + distance);
      addMatches(hits, term, word, weight);
    }
    return hits;
  }

  /** Documents matching any word of `query`, best first. */
  return function search(query: string): T[] {
    const terms = words(query)
      .map((word) => word.toLowerCase())
      .filter(Boolean);
    const hits = new Map<number, Hit>();
    for (const term of terms) {
      for (const [doc, hit] of searchTerm(term)) {
        const existing = hits.get(doc);
        if (existing) {
          existing.score += hit.score;
          for (const t of hit.terms) {
            if (!existing.terms.includes(t)) existing.terms.push(t);
          }
        } else {
          hits.set(doc, hit);
        }
      }
    }
    return (
      Array.from(hits, ([doc, hit]) => ({
        doc,
        score: hit.score * hit.terms.length,
      }))
        // Equal scores keep the index's order: components, then their
        // sections as the page has them.
        .sort((a, b) => b.score - a.score || a.doc - b.doc)
        .map(({ doc }) => documents[doc])
    );
  };
}
