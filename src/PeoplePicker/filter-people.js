// @ts-check
// Ranks a synchronous list of people against a query without sorting the
// whole list: a single pass drops each hit into one of four buckets, and the
// pass stops as soon as the best bucket holds enough. Folded copies of the
// text are built once per list, so a keystroke on 10,000 people does no
// allocation beyond the result. Adapted from `filterMentionItems` (Mentions,
// #5342), which matches `text` and `secondary`; this matches the name, then
// the email and secondary text.

/**
 * @typedef {Object} PersonLike
 * @property {string | number} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} [secondary]
 */

const ASCII = /^[\t\n\r -~]*$/;

// Latin combining marks, and the Arabic marks (harakat, tanween, shadda,
// the dagger alef), so "محمد" finds "مُحَمَّد".
const MARKS = /[̀-ًͯ-ٰٟ]/g;

/** @type {WeakMap<ReadonlyArray<PersonLike>, { name: string[], other: string[] }>} */
const folded = new WeakMap();

/**
 * Lowercase and drop accents, so "jose" finds "José".
 * @param {string | undefined} text
 */
export function foldText(text) {
  if (!text) return "";
  // Most text is ASCII, which has nothing to decompose.
  if (ASCII.test(text)) return text.toLowerCase();
  return text.normalize("NFD").replace(MARKS, "").toLowerCase();
}

/**
 * @param {PersonLike} person
 */
function otherText(person) {
  return person.email && person.secondary
    ? `${person.email} ${person.secondary}`
    : (person.email ?? person.secondary);
}

/**
 * @param {ReadonlyArray<PersonLike>} people
 */
function foldPeople(people) {
  let entry = folded.get(people);
  if (!entry) {
    entry = {
      name: people.map((person) => foldText(person.name)),
      other: people.map((person) => foldText(otherText(person))),
    };
    folded.set(people, entry);
  }
  return entry;
}

const WORD_EDGE = /[\s._\-@]/;

/**
 * Build the folded copies of `people` ahead of the first query, so the first
 * key typed does not pay for them.
 * @param {ReadonlyArray<PersonLike>} people
 */
export function warmPeople(people) {
  foldPeople(people);
}

/**
 * 0 for a prefix, 1 for the start of a later word, 2 for anywhere else,
 * -1 for no match.
 * @param {string} haystack
 * @param {string} query
 */
function rank(haystack, query) {
  const at = haystack.indexOf(query);
  if (at === -1) return -1;
  if (at === 0) return 0;
  return WORD_EDGE.test(haystack[at - 1]) ? 1 : 2;
}

/**
 * People that match `query`, best first, at most `limit`. A prefix of the
 * name beats the start of a later word, which beats a substring, which beats
 * a match on the email or secondary text only. Ties keep the order of
 * `people`. The list is read, never mutated. Replace the array to refresh
 * the cache.
 *
 * @template {PersonLike} T
 * @param {ReadonlyArray<T>} people
 * @param {string} query
 * @param {number} [limit] Most people returned. Defaults to 10.
 * @param {(person: T) => boolean} [exclude] Skips a person, such as one already chosen.
 * @returns {T[]}
 */
export function filterPeople(people, query, limit, exclude) {
  const q = foldText(query.trim());
  const max = limit ?? 10;

  if (!q) {
    if (!exclude) return people.slice(0, max);
    /** @type {T[]} */
    const out = [];
    for (let i = 0; i < people.length && out.length < max; i++) {
      if (!exclude(people[i])) out.push(people[i]);
    }
    return out;
  }

  const { name, other } = foldPeople(people);
  /** @type {[T[], T[], T[], T[]]} */
  const buckets = [[], [], [], []];

  for (let i = 0; i < people.length; i++) {
    let bucket = rank(name[i], q);
    if (bucket === -1) {
      const second = other[i] ? rank(other[i], q) : -1;
      if (second === -1) continue;
      bucket = 3;
    }
    if (exclude?.(people[i])) continue;
    buckets[bucket].push(people[i]);
    if (bucket === 0 && buckets[0].length >= max) break;
  }

  return buckets.flat().slice(0, max);
}
