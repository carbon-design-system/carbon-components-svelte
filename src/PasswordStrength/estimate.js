// @ts-check
// A small password strength estimator with no dependencies. It follows the
// shape of zxcvbn (find the cheapest way an attacker's guess list could
// spell the password, and count the guesses) with far less data: a ranked
// blocklist of common passwords, a few pattern matchers, and a per-character
// cost for what is left. It is guidance for the person typing, not a
// security control. See the "Guidance, not security" section of the docs.

import { decodeBlocklist, toBlocklist } from "./blocklist.js";
import { commonPasswords } from "./common-passwords.js";

/**
 * @typedef {import("./blocklist.js").Blocklist} Blocklist
 *
 * @typedef {"top10" | "top100" | "common" | "personal" | "repeatChar" | "repeatPattern" | "sequence" | "keyboard" | "date"} PasswordWarning
 * @typedef {"addWords" | "longer" | "avoidPersonal" | "avoidRepeats" | "avoidSequences" | "avoidKeyboard" | "avoidDates" | "predictable" | "capsNoHelp"} PasswordSuggestion
 *
 * @typedef {object} PasswordFeedback
 * @property {PasswordWarning | string | null} warning - A code for `feedbackTexts`.
 * @property {(PasswordSuggestion | string)[]} suggestions
 *
 * @typedef {"instantly" | "seconds" | "minutes" | "hours" | "days" | "months" | "years" | "centuries"} CrackTimeBucket
 *
 * @typedef {object} CrackTime
 * @property {number} seconds
 * @property {CrackTimeBucket} bucket
 *
 * @typedef {object} PasswordPattern
 * @property {"dictionary" | "user" | "repeat" | "sequence" | "keyboard" | "date" | "year"} pattern
 * @property {number} start - Index of the first character (code points).
 * @property {number} end - Index of the last character, inclusive.
 * @property {number} bits
 *
 * @typedef {"empty" | "weak" | "fair" | "good" | "strong"} PasswordLevel
 *
 * @typedef {object} PasswordEstimate
 * @property {0 | 1 | 2 | 3 | 4} score - As zxcvbn: 0 and 1 are weak, 2 fair, 3 good, 4 strong.
 * @property {PasswordLevel} level
 * @property {number} bits - log2 of the estimated guesses.
 * @property {number} guesses
 * @property {{ onlineThrottled: CrackTime, onlineUnthrottled: CrackTime, offlineSlow: CrackTime, offlineFast: CrackTime }} crackTimes
 * @property {PasswordFeedback} feedback
 * @property {PasswordPattern[]} patterns - What the password was split into. Holds positions, never the text.
 * @property {number} length
 *
 * @typedef {object} EstimateOptions
 * @property {string[]} [userInputs] - Strings to penalize: name, email, company.
 * @property {Blocklist | Iterable<string>} [blocklist] - Replaces the built-in top 1,000.
 */

const NON_WORD = /[^\p{L}\p{N}]+/u;
const LETTER = /\p{L}/u;
const LOWER = /\p{Ll}/u;
const UPPER = /\p{Lu}/u;
const DIGIT = /\p{Nd}/u;
const ASCII_SYMBOL = /[\x20-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/;
const NON_ASCII = /[^\p{ASCII}]/u;
const NON_LATIN = /[^\p{Script=Latin}\p{N}]/u;
const LATIN = /\p{Script=Latin}/u;
const A_Z = /[a-z]/;
const CAP_A_Z = /[A-Z]/;
const ZERO_NINE = /[0-9]/;

/** The longest password looked at. Longer ones are estimated by their first part. */
export const MAX_ESTIMATE_LENGTH = 128;

/** Score boundaries in bits of guesses. */
const SCORE_BITS = [20, 30, 40, 50];

/** Bits per character for text that reads like words. */
const WORDLIKE_BITS = 2.5;
/** Bits per character for up to three digits or symbols after a word ("word1!"). */
const SUFFIX_BITS = 4;
/** Cost of joining one pattern to its neighbors. */
const MATCH_OVERHEAD_BITS = 1;
const MAX_WORD = 24;

/** Guesses per second, as zxcvbn's four attack scenarios. */
const RATES = {
  onlineThrottled: 100 / 3600,
  onlineUnthrottled: 10,
  offlineSlow: 1e4,
  offlineFast: 1e10,
};

/** @type {Record<string, string>} */
const LEET = {
  "@": "a",
  4: "a",
  8: "b",
  "(": "c",
  3: "e",
  6: "g",
  1: "i",
  "!": "i",
  "|": "l",
  0: "o",
  $: "s",
  5: "s",
  7: "t",
  "+": "t",
  2: "z",
};
const LEET_ALT = { ...LEET, 1: "l", "!": "l" };

/** @type {Blocklist | undefined} */
let defaultBlocklist;

/** The built-in top-1,000 blocklist, decoded on first use. */
export function getDefaultBlocklist() {
  defaultBlocklist ??= decodeBlocklist(commonPasswords);
  return defaultBlocklist;
}

/**
 * @param {string} s
 * @param {Record<string, string>} map
 */
function unleet(s, map) {
  let out = "";
  for (const c of s) out += map[c] ?? c;
  return out;
}

/** @param {number} n */
const log2 = (n) => Math.log(n) / Math.LN2;

/**
 * @param {number} n
 * @param {number} k
 */
function binom(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * Split user-supplied strings into the words worth penalizing. An email
 * address gives its local part and the domain without the top-level label.
 *
 * @param {string[] | undefined} inputs
 * @returns {string[]}
 */
export function userInputTokens(inputs) {
  /** @type {string[]} */
  const tokens = [];
  const add = (/** @type {string} */ t) => {
    if ([...t].length >= 3 && !tokens.includes(t)) tokens.push(t);
  };
  for (const raw of inputs ?? []) {
    if (typeof raw !== "string") continue;
    const input = raw.trim().toLowerCase();
    if (!input) continue;
    add(input);
    const [local, domain] = input.includes("@")
      ? [
          input.slice(0, input.lastIndexOf("@")),
          input.slice(input.lastIndexOf("@") + 1),
        ]
      : [input, ""];
    add(local);
    for (const part of local.split(NON_WORD)) add(part);
    const labels = domain.split(".");
    for (const part of labels.slice(0, -1)) add(part);
  }
  return tokens;
}

/**
 * Whether a password is on the blocklist, allowing for a few characters of
 * trailing digits or symbols and common letter substitutions.
 *
 * @param {string} password
 * @param {Blocklist | Iterable<string> | null} [blocklist]
 */
export function isCommonPassword(password, blocklist) {
  const list = toBlocklist(blocklist) ?? getDefaultBlocklist();
  const lower = password.toLowerCase();
  if (!lower) return false;
  for (const map of [{}, LEET, LEET_ALT]) {
    const word = unleet(lower, map);
    for (let cut = 0; cut <= 3; cut++) {
      const head = word.slice(0, word.length - cut);
      if (head.length < 4 && cut > 0) break;
      if (cut > 0 && LETTER.test(word.slice(word.length - cut))) break;
      if (list.rank(head) !== undefined) return true;
    }
  }
  return false;
}

// Keyboard layout: each key at (x, row). Rows are staggered like a physical
// keyboard, and two keys are neighbors when they sit within one key width.
const ROWS = [
  ["`1234567890-=", 0],
  ["qwertyuiop[]\\", 1.5],
  ["asdfghjkl;'", 1.75],
  ["zxcvbnm,./", 2.25],
];
const SHIFTED = '~!@#$%^&*()_+{}|:"<>?';

/** @type {Map<string, { x: number, row: number }>} */
const KEYS = new Map();
for (const [r, [keys, offset]] of ROWS.entries()) {
  [...String(keys)].forEach((k, i) => {
    KEYS.set(k, { x: Number(offset) + i, row: r });
  });
}
// Shifted symbols sit on the key of their unshifted partner.
const SHIFT_PAIRS = "~`!1@2#3$4%5^6&7*8(9)0_-+={[}]|\\:;\"'<,>.?/";
for (let i = 0; i < SHIFT_PAIRS.length; i += 2) {
  const base = KEYS.get(SHIFT_PAIRS[i + 1]);
  if (base) KEYS.set(SHIFT_PAIRS[i], base);
}

/** @param {string} a @param {string} b */
function adjacent(a, b) {
  const ka = KEYS.get(a);
  const kb = KEYS.get(b);
  if (!ka || !kb || a === b) return false;
  const rows = Math.abs(ka.row - kb.row);
  if (rows > 1) return false;
  const dx = Math.abs(ka.x - kb.x);
  return rows === 0 ? dx <= 1 : dx < 1;
}

const KEY_COUNT = new Set([...KEYS.values()]).size;
let degreeSum = 0;
for (const a of [...KEYS.keys()]) {
  for (const b of [...KEYS.keys()]) if (adjacent(a, b)) degreeSum++;
}
const AVG_DEGREE = degreeSum / KEYS.size;

/**
 * @param {number} len
 * @param {number} turns
 */
function walkBits(len, turns) {
  let guesses = 0;
  for (let i = 2; i <= len; i++) {
    for (let j = 1; j <= Math.min(turns, i - 1); j++) {
      guesses += binom(i - 1, j - 1) * KEY_COUNT * AVG_DEGREE ** j;
    }
  }
  return log2(Math.max(guesses, 1));
}

/**
 * Bits for the capitalization of a matched word.
 * @param {string} word - As typed.
 */
function caseBits(word) {
  const letters = [...word].filter((c) => c.toLowerCase() !== c.toUpperCase());
  const upper = letters.filter((c) => c !== c.toLowerCase()).length;
  const lower = letters.length - upper;
  if (upper === 0) return 0;
  if (lower === 0) return 1;
  if (upper === 1 && word[0] !== word[0].toLowerCase()) return 1;
  let sum = 0;
  for (let k = 1; k <= Math.min(upper, lower); k++) {
    sum += binom(letters.length, k);
  }
  return log2(sum);
}

/** @param {string} s */
function classes(s) {
  let card = 0;
  if (LOWER.test(s)) card += 26;
  if (UPPER.test(s)) card += 26;
  if (DIGIT.test(s)) card += 10;
  if (ASCII_SYMBOL.test(s)) card += 33;
  if (NON_ASCII.test(s) && NON_LATIN.test(s)) card += 100;
  return Math.max(card, 10);
}

/**
 * Per-character cost of text no pattern explains.
 * @param {string[]} chars
 */
function freeCosts(chars) {
  const card = log2(classes(chars.join("")));
  const costs = chars.map(() => card);
  const n = chars.length;
  let k = 0;
  let lastRunEnd = -1;
  while (k < n) {
    // A run of letters and letter-like characters ("tr0ub4dor") reads as a
    // word, however it is spelled.
    let end = k;
    let real = 0;
    while (end < n) {
      const c = chars[end];
      const isLetter = LATIN.test(c) && c.toLowerCase() !== c.toUpperCase();
      if (isLetter) real++;
      else if (!(c in LEET)) break;
      end++;
    }
    const len = end - k;
    if (len >= 4 && real >= 0.6 * len) {
      const run = chars.slice(k, end);
      let extra = 0;
      const upper = run.filter((c) => c !== c.toLowerCase()).length;
      if (upper > 0) {
        const allUpper =
          upper ===
          run.filter((c) => c.toLowerCase() !== c.toUpperCase()).length;
        extra +=
          allUpper || (upper === 1 && run[0] !== run[0].toLowerCase()) ? 1 : 3;
      }
      for (let m = k; m < end; m++) {
        costs[m] = WORDLIKE_BITS + (chars[m] in LEET ? 1 : 0);
      }
      costs[k] += extra;
      lastRunEnd = end;
      k = end;
    } else {
      k = end > k ? end : k + 1;
    }
  }
  // Attackers try "word1", "word123" and "word!" first.
  if (lastRunEnd > 0 && n - lastRunEnd <= 3) {
    for (let m = lastRunEnd; m < n; m++)
      costs[m] = Math.min(costs[m], SUFFIX_BITS);
  }
  return costs;
}

/**
 * @typedef {PasswordPattern & { code?: string, rank?: number, repeated?: number, leet?: boolean, upper?: boolean }} Match
 */

/**
 * @param {string[]} chars
 * @param {string[]} lowerChars
 * @param {Blocklist} list
 * @param {string[]} userTokens
 * @returns {Match[]}
 */
function dictionaryMatches(chars, lowerChars, list, userTokens) {
  /** @type {Match[]} */
  const out = [];
  const n = chars.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n && j - i < MAX_WORD; j++) {
      const lower = lowerChars.slice(i, j + 1).join("");
      const original = chars.slice(i, j + 1).join("");
      const userRank = userTokens.indexOf(lower);
      if (userRank >= 0) {
        out.push({
          pattern: "user",
          start: i,
          end: j,
          bits: log2(userRank + 2) + caseBits(original),
        });
        continue;
      }
      let best;
      for (const map of [null, LEET, LEET_ALT]) {
        const word = map ? unleet(lower, map) : lower;
        const rank = list.rank(word);
        if (rank === undefined) continue;
        let subs = 0;
        if (map)
          for (let k = 0; k < lower.length; k++)
            if (word[k] !== lower[k]) subs++;
        if (map && subs === 0) continue;
        const bits = log2(rank) + caseBits(original) + subs;
        if (!best || bits < best.bits) {
          best = /** @type {Match} */ ({
            pattern: "dictionary",
            start: i,
            end: j,
            bits,
            rank,
            leet: subs > 0,
            upper:
              original === original.toUpperCase() &&
              original !== original.toLowerCase(),
          });
        }
      }
      if (best) out.push(best);
    }
  }
  return out;
}

/** @param {string[]} chars */
function sequenceMatches(chars) {
  /** @type {Match[]} */
  const out = [];
  const n = chars.length;
  const code = (/** @type {string} */ c) => c.codePointAt(0) ?? 0;
  const kind = (/** @type {string} */ c) =>
    A_Z.test(c) ? 1 : CAP_A_Z.test(c) ? 2 : ZERO_NINE.test(c) ? 3 : 0;
  let i = 0;
  while (i < n - 1) {
    const delta = code(chars[i + 1]) - code(chars[i]);
    const k = kind(chars[i]);
    if (k === 0 || Math.abs(delta) !== 1 || kind(chars[i + 1]) !== k) {
      i++;
      continue;
    }
    let j = i + 1;
    while (
      j + 1 < n &&
      kind(chars[j + 1]) === k &&
      code(chars[j + 1]) - code(chars[j]) === delta
    ) {
      j++;
    }
    if (j - i + 1 >= 3) {
      const first = chars[i];
      const base = "aAzZ019".includes(first)
        ? 2
        : k === 3
          ? log2(10)
          : log2(26);
      out.push({
        pattern: "sequence",
        start: i,
        end: j,
        bits: base + log2(j - i + 1) + (delta < 0 ? 1 : 0),
      });
    }
    i = j;
  }
  return out;
}

/** @param {string[]} chars */
function keyboardMatches(chars) {
  /** @type {Match[]} */
  const out = [];
  const n = chars.length;
  let i = 0;
  while (i < n - 1) {
    let j = i;
    let turns = 1;
    let lastDir = "";
    let shifted = 0;
    while (j + 1 < n) {
      const a = KEYS.get(chars[j].toLowerCase());
      const b = KEYS.get(chars[j + 1].toLowerCase());
      if (
        !a ||
        !b ||
        !adjacent(chars[j].toLowerCase(), chars[j + 1].toLowerCase())
      )
        break;
      const dir = `${Math.sign(b.x - a.x)},${b.row - a.row}`;
      if (lastDir && dir !== lastDir) turns++;
      lastDir = dir;
      j++;
    }
    for (let k = i; k <= j; k++) {
      const c = chars[k];
      if (
        SHIFTED.includes(c) ||
        (c !== c.toLowerCase() && c === c.toUpperCase())
      )
        shifted++;
    }
    if (j - i + 1 >= 4) {
      out.push({
        pattern: "keyboard",
        start: i,
        end: j,
        bits: walkBits(j - i + 1, turns) + (shifted ? 1 : 0),
      });
      i = j;
    } else {
      i++;
    }
  }
  return out;
}

/**
 * @param {string} digits
 * @returns {boolean} Whether 4 to 8 digits read as a day, month and year.
 */
function isDateDigits(digits) {
  const len = digits.length;
  if (len < 4 || len > 8) return false;
  /** @type {[number, number, number][]} */
  const splits = [];
  const ymd = (/** @type {number} */ a, /** @type {number} */ b) => [
    digits.slice(0, a),
    digits.slice(a, b),
    digits.slice(b),
  ];
  for (const [a, b] of [
    [1, 2],
    [1, 3],
    [2, 3],
    [2, 4],
    [4, 5],
    [4, 6],
  ]) {
    const [p, q, r] = ymd(a, b);
    if (p && q && r) splits.push([Number(p), Number(q), Number(r)]);
  }
  const validYear = (
    /** @type {number} */ y,
    /** @type {number} */ digitsLen,
  ) => digitsLen === 2 || (y >= 1900 && y <= 2039);
  return splits.some(([p, q, r]) => {
    const rLen = String(r).length;
    const dm =
      (p >= 1 && p <= 31 && q >= 1 && q <= 12) ||
      (q >= 1 && q <= 31 && p >= 1 && p <= 12);
    if (
      dm &&
      (rLen === 4 ||
        rLen === 2 ||
        digits.length - String(p).length - String(q).length === 2)
    ) {
      return validYear(r, digits.length - String(p).length - String(q).length);
    }
    return p >= 1900 && p <= 2039 && q >= 1 && q <= 12 && r >= 1 && r <= 31;
  });
}

/** @param {string[]} chars */
function dateMatches(chars) {
  /** @type {Match[]} */
  const out = [];
  const s = chars.join("");
  for (const m of s.matchAll(/(?:19|20)\d{2}/g)) {
    out.push({
      pattern: "year",
      start: m.index,
      end: m.index + 3,
      bits: log2(141),
    });
  }
  for (const m of s.matchAll(/\d{6,8}/g)) {
    for (const len of [8, 6]) {
      for (let off = 0; off + len <= m[0].length; off++) {
        if (isDateDigits(m[0].slice(off, off + len))) {
          out.push({
            pattern: "date",
            start: m.index + off,
            end: m.index + off + len - 1,
            bits: log2(372 * (len === 8 ? 141 : 100)),
          });
        }
      }
    }
  }
  for (const m of s.matchAll(
    /(\d{1,2})([\s/\\_.-])(\d{1,2})\2(\d{4}|\d{2})/g,
  )) {
    if (isDateDigits(m[1] + m[3] + m[4])) {
      out.push({
        pattern: "date",
        start: m.index,
        end: m.index + m[0].length - 1,
        bits: log2(372 * (m[4].length === 4 ? 141 : 100)) + 2,
      });
    }
  }
  return out;
}

/**
 * @param {string[]} chars
 * @param {(chars: string[]) => number} baseBits
 */
function repeatMatches(chars, baseBits) {
  /** @type {Match[]} */
  const out = [];
  const n = chars.length;
  for (let i = 0; i < n; i++) {
    for (let len = 1; len <= Math.min(32, (n - i) >> 1); len++) {
      let count = 1;
      while (i + (count + 1) * len <= n) {
        let same = true;
        for (let k = 0; k < len; k++) {
          if (chars[i + k] !== chars[i + count * len + k]) {
            same = false;
            break;
          }
        }
        if (!same) break;
        count++;
      }
      if (count >= 2 && len * count >= 3) {
        out.push({
          pattern: "repeat",
          start: i,
          end: i + len * count - 1,
          bits: baseBits(chars.slice(i, i + len)) + log2(count),
          repeated: len,
        });
        // Greedy: the rest of the run is this match, not new ones.
        i += len * count - 1;
        break;
      }
    }
  }
  return out;
}

/**
 * Cheapest explanation of `chars`, in bits.
 *
 * @param {string[]} chars
 * @param {Blocklist} list
 * @param {string[]} userTokens
 * @param {boolean} [allowRepeat]
 * @returns {{ bits: number, matches: Match[] }}
 */
function cheapest(chars, list, userTokens, allowRepeat = true) {
  const n = chars.length;
  const lowerChars = chars.map((c) => {
    const l = c.toLowerCase();
    return l.length === c.length ? l : c;
  });
  const free = freeCosts(chars);
  const matches = [
    ...dictionaryMatches(chars, lowerChars, list, userTokens),
    ...sequenceMatches(chars),
    ...keyboardMatches(chars),
    ...dateMatches(chars),
    ...(allowRepeat
      ? repeatMatches(
          chars,
          (base) => cheapest(base, list, userTokens, false).bits,
        )
      : []),
  ];
  /** @type {Match[][]} */
  const endingAt = Array.from({ length: n }, () => []);
  for (const m of matches) endingAt[m.end].push(m);

  const best = new Float64Array(n + 1);
  /** @type {(Match | null)[]} */
  const via = new Array(n + 1).fill(null);
  for (let k = 1; k <= n; k++) {
    best[k] = best[k - 1] + free[k - 1];
    for (const m of endingAt[k - 1]) {
      const cand = best[m.start] + m.bits + MATCH_OVERHEAD_BITS;
      if (cand < best[k]) {
        best[k] = cand;
        via[k] = m;
      }
    }
  }
  /** @type {Match[]} */
  const chosen = [];
  for (let k = n; k > 0;) {
    const m = via[k];
    if (m) {
      chosen.unshift(m);
      k = m.start;
    } else {
      k--;
    }
  }
  return { bits: best[n], matches: chosen };
}

/**
 * @param {number} seconds
 * @returns {CrackTimeBucket}
 */
function bucket(seconds) {
  if (seconds < 1) return "instantly";
  if (seconds < 60) return "seconds";
  if (seconds < 3600) return "minutes";
  if (seconds < 86400) return "hours";
  if (seconds < 86400 * 31) return "days";
  if (seconds < 86400 * 365) return "months";
  if (seconds < 86400 * 365 * 100) return "years";
  return "centuries";
}

/**
 * @param {number} guesses
 * @returns {PasswordEstimate["crackTimes"]}
 */
function crackTimes(guesses) {
  const at = (/** @type {number} */ rate) => {
    const seconds = guesses / rate;
    return { seconds, bucket: bucket(seconds) };
  };
  return {
    onlineThrottled: at(RATES.onlineThrottled),
    onlineUnthrottled: at(RATES.onlineUnthrottled),
    offlineSlow: at(RATES.offlineSlow),
    offlineFast: at(RATES.offlineFast),
  };
}

/**
 * @param {number} score
 * @returns {Exclude<PasswordLevel, "empty">}
 */
export function levelFromScore(score) {
  return score <= 1
    ? "weak"
    : score === 2
      ? "fair"
      : score === 3
        ? "good"
        : "strong";
}

/**
 * @param {Match[]} matches
 * @param {number} score
 * @param {number} length
 * @returns {PasswordFeedback}
 */
function feedbackFor(matches, score, length) {
  if (score >= 3) return { warning: null, suggestions: [] };
  /** @type {PasswordFeedback} */
  const feedback = { warning: null, suggestions: [] };
  const biggest = matches.reduce(
    (a, m) => (!a || m.end - m.start > a.end - a.start ? m : a),
    /** @type {Match | undefined} */ (undefined),
  );
  const add = (/** @type {string} */ s) => {
    if (!feedback.suggestions.includes(s)) feedback.suggestions.push(s);
  };
  if (biggest) {
    switch (biggest.pattern) {
      case "dictionary":
        feedback.warning =
          (biggest.rank ?? 0) <= 10
            ? "top10"
            : (biggest.rank ?? 0) <= 100
              ? "top100"
              : "common";
        if (biggest.upper) add("capsNoHelp");
        if (biggest.leet) add("predictable");
        break;
      case "user":
        feedback.warning = "personal";
        add("avoidPersonal");
        break;
      case "repeat":
        feedback.warning =
          biggest.repeated === 1 ? "repeatChar" : "repeatPattern";
        add("avoidRepeats");
        break;
      case "sequence":
        feedback.warning = "sequence";
        add("avoidSequences");
        break;
      case "keyboard":
        feedback.warning = "keyboard";
        add("avoidKeyboard");
        break;
      case "date":
      case "year":
        feedback.warning = "date";
        add("avoidDates");
        break;
    }
  }
  if (length < 12) add("longer");
  add("addWords");
  feedback.suggestions = feedback.suggestions.slice(0, 3);
  return feedback;
}

/**
 * Estimate how long a password would take to guess.
 *
 * Pure and synchronous: about 100 microseconds for a typical password. The
 * result holds scores, counts and pattern positions, never the password or
 * any piece of it, so it is safe to put in a store or an event.
 *
 * @param {string} password
 * @param {EstimateOptions} [options]
 * @returns {PasswordEstimate}
 */
export function estimatePasswordStrength(password, options = {}) {
  const all = [...String(password ?? "")];
  const chars = all.slice(0, MAX_ESTIMATE_LENGTH);
  if (chars.length === 0) {
    return {
      score: 0,
      level: "empty",
      bits: 0,
      guesses: 1,
      crackTimes: crackTimes(1),
      feedback: { warning: null, suggestions: [] },
      patterns: [],
      length: 0,
    };
  }
  const list = toBlocklist(options.blocklist) ?? getDefaultBlocklist();
  const { bits, matches } = cheapest(
    chars,
    list,
    userInputTokens(options.userInputs),
  );
  const score = /** @type {0 | 1 | 2 | 3 | 4} */ (
    SCORE_BITS.filter((t) => bits >= t).length
  );
  const guesses = 2 ** bits;
  return {
    score,
    level: levelFromScore(score),
    bits: Math.round(bits * 10) / 10,
    guesses,
    crackTimes: crackTimes(guesses),
    feedback: feedbackFor(matches, score, all.length),
    patterns: matches.map(({ pattern, start, end, bits }) => ({
      pattern,
      start,
      end,
      bits: Math.round(bits * 10) / 10,
    })),
    length: all.length,
  };
}

/** English feedback text, by the codes in `PasswordFeedback`. */
export const DEFAULT_FEEDBACK_TEXTS = {
  top10: "This is a top-10 common password.",
  top100: "This is a top-100 common password.",
  common: "This is a commonly used password.",
  personal: "Names and email addresses are easy to guess.",
  repeatChar: 'Repeats like "aaa" are easy to guess.',
  repeatPattern:
    'Repeats like "abcabcabc" are only slightly harder to guess than "abc".',
  sequence: 'Sequences like "abc" or "6543" are easy to guess.',
  keyboard: "Keyboard patterns are easy to guess.",
  date: "Dates are often easy to guess.",
  addWords: "Add another word or two. Uncommon words are better.",
  longer: "Make it longer.",
  avoidPersonal: "Leave out your name and email address.",
  avoidRepeats: "Avoid repeated words and characters.",
  avoidSequences: "Avoid sequences.",
  avoidKeyboard: "Avoid keyboard patterns.",
  avoidDates: "Avoid dates and years that are associated with you.",
  predictable:
    'Predictable substitutions like "@" for "a" do not help very much.',
  capsNoHelp: "All-uppercase is almost as easy to guess as all-lowercase.",
};
