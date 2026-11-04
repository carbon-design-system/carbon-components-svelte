// @ts-check

/**
 * @typedef {object} MapTarget
 * @property {string} key
 * @property {string} label
 * @property {ReadonlyArray<string>} [aliases]
 */

/**
 * Lowercase, strip accents, split camelCase and drop punctuation:
 * "E-mail Address" and "emailAddress" both become "e mail address" and
 * "email address", which `similarity` then compares.
 * @param {string} name
 */
export function normalizeHeader(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** @param {string} s */
function bigrams(s) {
  /** @type {Map<string, number>} */
  const out = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

/**
 * Edit distance counting a swap of two neighbors as one edit.
 * @param {string} a
 * @param {string} b
 */
function editDistance(a, b) {
  /** @type {number[][]} */
  const d = [];
  for (let i = 0; i <= a.length; i++) {
    d.push([i]);
    for (let j = 1; j <= b.length; j++) d[i][j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * A 0 to 1 score for two header names: 1 for the same words in any spacing,
 * 0.95 for the same words in another order, then the better of the Dice
 * coefficient on character pairs and the edit distance (so "Emial" finds
 * "Email"), with a floor of about 0.75 when one name holds the other's whole words.
 * @param {string} a
 * @param {string} b
 */
export function similarity(a, b) {
  const x = normalizeHeader(a);
  const y = normalizeHeader(b);
  if (!x || !y) return 0;
  const jx = x.replace(/ /g, "");
  const jy = y.replace(/ /g, "");
  if (jx === jy) return 1;
  if (x.split(" ").sort().join("") === y.split(" ").sort().join("")) {
    return 0.95;
  }
  let dice = 0;
  if (jx.length > 1 && jy.length > 1) {
    const gx = bigrams(jx);
    const gy = bigrams(jy);
    let shared = 0;
    for (const [g, count] of gx) shared += Math.min(count, gy.get(g) || 0);
    dice = (2 * shared) / (jx.length - 1 + (jy.length - 1));
  }
  if (jx.length <= 40 && jy.length <= 40) {
    dice = Math.max(
      dice,
      1 - editDistance(jx, jy) / Math.max(jx.length, jy.length),
    );
  }
  // One name made of the other's whole words ("Email Address" and "Email").
  const inner = x.length < y.length ? x : y;
  const outer = inner === x ? y : x;
  if (` ${outer} `.includes(` ${inner} `)) {
    dice = Math.max(dice, 0.7 + (0.2 * inner.length) / outer.length);
  }
  return dice;
}

/**
 * @typedef {object} AutoMapOptions
 * @property {number} [threshold] - The lowest score that counts as a match. Defaults to 0.6.
 *
 * @typedef {object} AutoMapResult
 * @property {Array<string | null>} mapping - The target key for each source column, or `null`.
 * @property {number[]} scores - The match score for each source column (0 when unmatched).
 * @property {Array<"exact" | "alias" | "similar" | null>} reasons
 */

/**
 * Match source headers to target fields. Each field takes at most one column
 * and each column at most one field, best scores first.
 * @param {ReadonlyArray<string>} headers
 * @param {ReadonlyArray<MapTarget>} fields
 * @param {AutoMapOptions} [options]
 * @returns {AutoMapResult}
 */
export function autoMap(headers, fields, options = {}) {
  const threshold = options.threshold ?? 0.6;
  /** @type {Array<{ column: number, field: number, score: number, reason: "exact" | "alias" | "similar" }>} */
  const candidates = [];
  headers.forEach((header, column) => {
    fields.forEach((field, index) => {
      let best = Math.max(
        similarity(header, field.label),
        similarity(header, field.key),
      );
      /** @type {"exact" | "alias" | "similar"} */
      let reason = best === 1 ? "exact" : "similar";
      for (const alias of field.aliases || []) {
        const score = similarity(header, alias);
        if (score > best) {
          best = score;
          reason = score === 1 ? "alias" : "similar";
        }
      }
      if (best >= threshold) {
        candidates.push({ column, field: index, score: best, reason });
      }
    });
  });
  candidates.sort(
    (p, q) => q.score - p.score || p.column - q.column || p.field - q.field,
  );
  const mapping = headers.map(() => /** @type {string | null} */ (null));
  const scores = headers.map(() => 0);
  const reasons = headers.map(
    () => /** @type {"exact" | "alias" | "similar" | null} */ (null),
  );
  const taken = new Set();
  for (const c of candidates) {
    if (mapping[c.column] !== null || taken.has(c.field)) continue;
    mapping[c.column] = fields[c.field].key;
    scores[c.column] = c.score;
    reasons[c.column] = c.reason;
    taken.add(c.field);
  }
  return { mapping, scores, reasons };
}
