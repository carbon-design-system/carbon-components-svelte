// @ts-check
import { BoundedFifoCache } from "./bounded-fifo-cache.js";

/** The bucket for digits, symbols and anything outside a locale's alphabet. */
export const INDEX_OTHER = "#";

const LATIN = Object.freeze("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));

/** @param {string} letters */
const split = (letters) => Object.freeze(Array.from(letters));

/**
 * Index letters by language. A language absent here uses A to Z, and folds
 * an accented letter onto its base letter (German's Ä, Ö and Ü file under A,
 * O and U). The Nordic and Spanish tables keep their extra letters because
 * those sort after, or between, the Latin ones.
 *
 * @type {Record<string, ReadonlyArray<string>>}
 */
const ALPHABETS = {
  sv: [...LATIN, "Å", "Ä", "Ö"],
  fi: [...LATIN, "Å", "Ä", "Ö"],
  da: [...LATIN, "Æ", "Ø", "Å"],
  nb: [...LATIN, "Æ", "Ø", "Å"],
  nn: [...LATIN, "Æ", "Ø", "Å"],
  no: [...LATIN, "Æ", "Ø", "Å"],
  es: [...LATIN.slice(0, 14), "Ñ", ...LATIN.slice(14)],
  // Gojuon rows, then the Latin letters a name may start with.
  ja: [...split("あかさたなはまやらわ"), ...LATIN],
  // Pinyin initials. The Chinese characters are filed by `PINYIN_STARTS`.
  zh: LATIN,
  // Hangul initial consonants, double consonants folded onto the single.
  ko: [...split("ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"), ...LATIN],
  ru: split("АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ"),
  ar: split("ابتثجحخدذرزسشصضطظعغفقكلمنهوي"),
  he: split("אבגדהוזחטיכלמנסעפצקרשת"),
};

/**
 * Letters a character files under when it is not in the alphabet itself and
 * has no accent to strip. The accents (Ä, É, Ñ in a language without it) fold
 * through Unicode decomposition.
 */
const FOLD = {
  Æ: "A",
  Ø: "O",
  Œ: "O",
  Ł: "L",
  Đ: "D",
  Ð: "D",
  Þ: "T",
  // Arabic: letters that share a form with another.
  ة: "ه",
  ى: "ي",
  ء: "ا",
  ک: "ك",
  ی: "ي",
  // Hebrew final forms.
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

const KANA_ROWS = [
  "あいうえおぁぃぅぇぉ",
  "かきくけこゕゖ",
  "さしすせそ",
  "たちつてとっ",
  "なにぬねの",
  "はひふへほ",
  "まみむめも",
  "やゆよゃゅょ",
  "らりるれろ",
  "わをんゎゐゑ",
];
/** @type {Map<string, string> | undefined} */
let kanaRowOf;

// A character that begins each pinyin initial in the pinyin collation. A
// Chinese character files under the last of these that sorts at or before it.
// There are none for I, U and V: no syllable starts with them.
const PINYIN_STARTS = "阿八嚓哒妸发旮哈丌咔垃妈拿噢啪七然撒塌挖昔压匝";
const PINYIN_LETTERS = "ABCDEFGHJKLMNOPQRSTWXYZ";

// The 19 initials of a Hangul syllable, in order, as the letter each files under.
const HANGUL_FILED_AS = "ㄱㄱㄴㄷㄷㄹㅁㅂㅂㅅㅅㅇㅈㅈㅊㅋㅌㅍㅎ";

const LOCALE_SEPARATOR = /[-_]/;
const HAN = /\p{Script=Han}/u;

/** @type {BoundedFifoCache<string, Intl.Collator>} */
const collators = new BoundedFifoCache(16);

/**
 * A collator for `locale`, cached. Digits sort by value (`Item 2` before
 * `Item 10`).
 *
 * @param {string} locale
 * @returns {Intl.Collator}
 */
export function getIndexCollator(locale) {
  let collator = collators.get(locale);
  if (!collator) {
    try {
      collator = new Intl.Collator(locale, { numeric: true });
    } catch {
      collator = new Intl.Collator("en", { numeric: true });
    }
    collators.set(locale, collator);
  }
  return collator;
}

/** @param {string} locale */
function languageOf(locale) {
  return String(locale).split(LOCALE_SEPARATOR)[0].toLowerCase();
}

/**
 * The letters a locale's index shows, in order, without the `#` bucket.
 *
 * @param {string} [locale]
 * @returns {ReadonlyArray<string>}
 */
export function getIndexAlphabet(locale = "en") {
  return ALPHABETS[languageOf(locale)] ?? LATIN;
}

/** @param {string} char */
function pinyinInitial(char) {
  const collator = getIndexCollator("zh-u-co-pinyin");
  let low = 0;
  let high = PINYIN_STARTS.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (collator.compare(PINYIN_STARTS[mid], char) <= 0) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found < 0 ? INDEX_OTHER : PINYIN_LETTERS[found];
}

/** @param {string} char Hiragana, after katakana is converted. */
function kanaRow(char) {
  if (!kanaRowOf) {
    kanaRowOf = new Map();
    for (const row of KANA_ROWS) {
      for (const kana of row) kanaRowOf.set(kana, row[0]);
    }
  }
  return kanaRowOf.get(char);
}

/**
 * The index letter a piece of text files under.
 *
 * It looks at the first character only. Case, accents, katakana against
 * hiragana, voicing marks, Arabic hamza forms and Hebrew final forms are
 * folded, so `ä` files under `A` in German and under `Ä` in Swedish. A
 * character the locale's alphabet does not hold, such as a digit or a
 * symbol, files under `#`. Han characters file under their pinyin initial
 * in Chinese, using the collator, with no table of characters.
 *
 * @param {string} text
 * @param {string} [locale]
 * @param {ReadonlyArray<string>} [alphabet] Defaults to the locale's.
 * @returns {string}
 */
export function getIndexKey(
  text,
  locale = "en",
  alphabet = getIndexAlphabet(locale),
) {
  const first = String(text ?? "")
    .trimStart()
    .normalize("NFKC")
    .codePointAt(0);
  if (first === undefined) return INDEX_OTHER;
  const char = String.fromCodePoint(first);
  const language = languageOf(locale);

  // Most names start with an ASCII letter, a digit or a symbol.
  if (first < 0x80) {
    const ascii = char.toUpperCase();
    return alphabet.includes(ascii) ? ascii : INDEX_OTHER;
  }

  // Hangul syllables hold their initial consonant in the code point.
  if (first >= 0xac00 && first <= 0xd7a3) {
    const initial = HANGUL_FILED_AS[Math.floor((first - 0xac00) / 588)];
    return alphabet.includes(initial) ? initial : INDEX_OTHER;
  }
  if (HAN.test(char) && language === "zh") {
    const initial = pinyinInitial(char);
    return alphabet.includes(initial) ? initial : INDEX_OTHER;
  }

  // Katakana to hiragana; the voicing marks and small kana fold below.
  const hiragana =
    first >= 0x30a1 && first <= 0x30f6
      ? String.fromCodePoint(first - 0x60)
      : char;
  const stripped = hiragana
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC");
  const row = kanaRow(stripped[0] ?? "");
  if (row) return alphabet.includes(row) ? row : INDEX_OTHER;

  const upper = char.toUpperCase();
  if (alphabet.includes(upper)) return upper;
  const base = upper.normalize("NFD").replace(/\p{M}/gu, "")[0] ?? "";
  if (alphabet.includes(base)) return base;
  const folded = /** @type {Record<string, string>} */ (FOLD)[base];
  return folded && alphabet.includes(folded) ? folded : INDEX_OTHER;
}

/**
 * @template Item
 * @typedef {object} IndexGroup
 * @property {string} key The letter on the rail and on the section header.
 * @property {Item[]} items The section's items, sorted.
 */

/**
 * Sort items and file them under index letters.
 *
 * Without `groupBy`, an item files under `getIndexKey` of its sort text, in
 * the locale's alphabet, and the result holds every letter of it (empty ones
 * included, for the rail to disable) followed by `#`. With `groupBy`, the
 * result holds `sections`, or the keys it returned in collation order with
 * `#` last. An item whose key is not among `sections` files under `#`.
 *
 * Sections are sorted with the locale's collator on their own, so a
 * collation that disagrees with the alphabet's order can't split one.
 *
 * @template Item
 * @param {ReadonlyArray<Item>} items
 * @param {object} [options]
 * @param {(item: Item) => string} [options.sortKey] Text to sort and group by.
 * @param {string} [options.locale]
 * @param {(item: Item, locale: string) => string} [options.groupBy]
 * @param {ReadonlyArray<string>} [options.sections] The index letters, in order.
 * @param {boolean} [options.sort] Set to `false` for items already in order.
 * @returns {IndexGroup<Item>[]}
 */
export function groupIndexItems(items, options = {}) {
  const {
    sortKey = (item) => String(/** @type {any} */ (item)?.text ?? ""),
    locale = "en",
    groupBy,
    sort = true,
  } = options;
  const collator = getIndexCollator(locale);
  const alphabet =
    options.sections ?? (groupBy ? undefined : getIndexAlphabet(locale));

  /** @type {Map<string, Array<{ item: Item, text: string }>>} */
  const buckets = new Map();
  if (alphabet) for (const key of alphabet) buckets.set(key, []);
  if (!buckets.has(INDEX_OTHER) && (alphabet || !groupBy)) {
    buckets.set(INDEX_OTHER, []);
  }

  for (const item of items) {
    const text = sortKey(item);
    let key = groupBy
      ? groupBy(item, locale)
      : getIndexKey(text, locale, alphabet);
    if (alphabet && !buckets.has(key)) key = INDEX_OTHER;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    bucket.push({ item, text });
  }

  let keys = [...buckets.keys()];
  if (!alphabet) {
    keys = keys
      .filter((key) => key !== INDEX_OTHER)
      .sort(collator.compare)
      .concat(buckets.has(INDEX_OTHER) ? [INDEX_OTHER] : []);
  }

  return keys.map((key) => {
    const bucket = /** @type {Array<{ item: Item, text: string }>} */ (
      buckets.get(key)
    );
    if (sort) bucket.sort((a, b) => collator.compare(a.text, b.text));
    return { key, items: bucket.map((entry) => entry.item) };
  });
}
