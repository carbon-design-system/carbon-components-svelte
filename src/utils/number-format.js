// @ts-check
// A locale-aware number format for text fields: money, units and plain
// decimals. Pure functions only (no DOM), so a server can format a value and
// the tests can drive every case without a browser.
//
// The model is the *raw* string: `-`, ASCII digits and one `.`, for example
// `-1234.5`. The text is `render(raw)`: `Intl.NumberFormat#formatToParts` puts
// the grouping, the decimal mark, the sign, the currency or the unit where the
// locale wants them. The caret is a count of *raw characters* to its left, so
// it survives every separator, symbol and space the format adds or removes.

import { getNumberFormatter } from "./intl-formatter-cache.js";

/**
 * @typedef {import("./number-format.js").NumberFormatOptions} NumberFormatOptions
 * @typedef {import("./number-format.js").NumberChange} NumberChange
 * @typedef {import("./number-format.js").NumberFormat} NumberFormat
 */

/** Bidirectional marks `Intl` adds around numbers in some locales. */
const RE_BIDI = /[\u200e\u200f\u061c\u2066-\u2069]/g;
const RE_ND = /\p{Nd}/u;
const RE_CURRENCY_SYMBOL = /\p{Sc}/gu;
const RE_ISO_CODE = /\b[A-Z]{3}\b/g;
/** Hyphen, the Unicode dashes and the full-width and small minus signs. */
const DASHES = "-\u2010\u2011\u2012\u2013\u2014\u2212\ufe63\uff0d";
/** Group marks that are never a decimal mark. */
const RE_SPACE_LIKE_G = /[\s\u2019\u02bc\u00b4'`\u066c]/g;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const RE_RTL_SCRIPT = /^(Arab|Hebr|Thaa|Syrc|Nkoo|Adlm)$/;
const RE_RTL_LANGUAGE = /^(ar|he|fa|ur|ps|sd|ug|yi|dv|ckb)$/;
const RE_EXPONENT = /e/i;
const RE_LEADING_ZEROS = /^0+(?=\d)/;
const RE_ALL_ZEROS = /^0*$/;
const RE_DECIMAL = /^-?\d+(\.\d*)?$|^-?\.\d+$/;
const RE_BRACKETS_ONLY = /^[()\-\s]+$/;
const RE_DIGIT = /\d/;
const RE_NEGATIVE_ZERO = /^-0*(\.0*)?$/;
const RE_BRACKETED = /^[^()]*\([^()]*\)[^()]*$/;
const RE_STARTS_NUMBER = /^[0-9]|^[.,\u066b]\d/;
const RE_ENDS_NUMBER = /[0-9.,\u066b]$/;
const RE_NOT_NUMBER = /[^0-9.,\u066b\u066c'\u2019\u02bc\u00b4`\s]/;
const RE_DIGITS_ONLY = /^\d+$/;
const RE_LEADING_MINUS = /^-/;

/**
 * Common symbols and their `Intl` unit identifiers, so `unit="kg"` and
 * `unit="%"` work next to `unit="kilogram"`.
 * @type {Record<string, string>}
 */
const UNIT_ALIASES = {
  "%": "percent",
  "\u00b0": "degree",
  "\u00b0C": "celsius",
  "\u00b0F": "fahrenheit",
  b: "bit",
  B: "byte",
  KB: "kilobyte",
  MB: "megabyte",
  GB: "gigabyte",
  TB: "terabyte",
  PB: "petabyte",
  Kb: "kilobit",
  Mb: "megabit",
  Gb: "gigabit",
  mg: "milligram",
  g: "gram",
  kg: "kilogram",
  oz: "ounce",
  lb: "pound",
  mm: "millimeter",
  cm: "centimeter",
  m: "meter",
  km: "kilometer",
  in: "inch",
  ft: "foot",
  yd: "yard",
  mi: "mile",
  ml: "milliliter",
  mL: "milliliter",
  l: "liter",
  L: "liter",
  ms: "millisecond",
  s: "second",
  min: "minute",
  h: "hour",
  d: "day",
  wk: "week",
  mo: "month",
  yr: "year",
  "km/h": "kilometer-per-hour",
  mph: "mile-per-hour",
  "m/s": "meter-per-second",
};

/**
 * The code point's digit value for any Unicode decimal digit (Arabic-Indic three is 3).
 * Every `Nd` block is a run of ten that starts at zero, so the count of
 * digits before this one in its run is the value.
 * @param {string} char
 * @returns {number} -1 when `char` is not a decimal digit.
 */
function digitValue(char) {
  if (char >= "0" && char <= "9") return char.charCodeAt(0) - 48;
  if (!RE_ND.test(char)) return -1;
  const cp = /** @type {number} */ (char.codePointAt(0));
  let before = 0;
  while (
    cp - before - 1 >= 0 &&
    RE_ND.test(String.fromCodePoint(cp - before - 1))
  ) {
    before++;
  }
  return before % 10;
}

/** @param {string} s */
const stripBidi = (s) => s.replace(RE_BIDI, "");

/**
 * The text direction of a locale, from its script when `Intl.Locale` cannot
 * say.
 * @param {string} locale
 * @returns {"ltr" | "rtl"}
 */
function localeDirection(locale) {
  try {
    const l = /** @type {any} */ (new Intl.Locale(locale));
    const info = l.getTextInfo?.() ?? l.textInfo;
    if (info?.direction) return info.direction;
    const lang = l.language;
    const script = l.script ?? l.maximize().script;
    if (script) return RE_RTL_SCRIPT.test(script) ? "rtl" : "ltr";
    return RE_RTL_LANGUAGE.test(lang) ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}

// --- Decimal strings ------------------------------------------------------
// Money is kept as a string: `0.1 + 0.2` is not 0.3 as a double, and a double
// holds 15 or 16 significant digits. These work on `-?digits(.digits)?`.

/**
 * A finite number as a plain decimal string, with no exponent.
 * @param {number} n
 * @returns {string}
 */
export function numberToDecimal(n) {
  if (!Number.isFinite(n)) return "";
  const s = String(n);
  if (!RE_EXPONENT.test(s)) return s;
  const [mantissa, exponent] = s.toLowerCase().split("e");
  const negative = mantissa.startsWith("-");
  const [int, frac = ""] = mantissa.replace("-", "").split(".");
  const digits = int + frac;
  const point = int.length + Number(exponent);
  let out;
  if (point <= 0) out = `0.${"0".repeat(-point)}${digits}`;
  else if (point >= digits.length)
    out = digits + "0".repeat(point - digits.length);
  else out = `${digits.slice(0, point)}.${digits.slice(point)}`;
  return (negative ? "-" : "") + out;
}

/** @param {string} digits Digits only. @returns {string} */
function incrementDigits(digits) {
  const out = digits.split("");
  let i = out.length - 1;
  while (i >= 0) {
    if (out[i] === "9") {
      out[i] = "0";
      i--;
    } else {
      out[i] = String(Number(out[i]) + 1);
      return out.join("");
    }
  }
  return `1${out.join("")}`;
}

/**
 * Round a decimal string to `digits` fraction digits, halves away from zero
 * (what `Intl.NumberFormat` does).
 * @param {string} value
 * @param {number} digits
 * @returns {string}
 */
export function roundDecimal(value, digits) {
  const negative = value.startsWith("-");
  const body = negative ? value.slice(1) : value;
  const [int, frac = ""] = body.split(".");
  if (frac.length <= digits) return value;
  let all = int + frac.slice(0, digits);
  if (frac.charCodeAt(digits) - 48 >= 5) all = incrementDigits(all);
  const cut = all.length - digits;
  const head = all.slice(0, cut) || "0";
  const tail = all.slice(cut);
  return (negative ? "-" : "") + head + (digits ? `.${tail}` : "");
}

/**
 * @param {string} value
 * @returns {{ negative: boolean, int: string, frac: string }}
 */
function split(value) {
  const negative = value.startsWith("-");
  const [int = "", frac = ""] = (negative ? value.slice(1) : value).split(".");
  const trimmed = int.replace(RE_LEADING_ZEROS, "");
  return { negative, int: trimmed === "" ? "0" : trimmed, frac };
}

/**
 * Compare two decimal strings without floating point.
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
export function compareDecimal(a, b) {
  const x = split(a);
  const y = split(b);
  const width = Math.max(x.frac.length, y.frac.length);
  const nx = x.int + x.frac.padEnd(width, "0");
  const ny = y.int + y.frac.padEnd(width, "0");
  const zeroX = RE_ALL_ZEROS.test(nx);
  const zeroY = RE_ALL_ZEROS.test(ny);
  const sx = x.negative && !zeroX ? -1 : 1;
  const sy = y.negative && !zeroY ? -1 : 1;
  if (sx !== sy) return sx < sy ? -1 : 1;
  const len = nx.length - ny.length;
  /** @type {number} */
  let order;
  if (len === 0) order = nx < ny ? -1 : nx > ny ? 1 : 0;
  else order = len < 0 ? -1 : 1;
  return /** @type {-1 | 0 | 1} */ (sx === 1 ? order : -order);
}

/**
 * Whether `value` is a whole multiple of `step`, in decimal arithmetic.
 * @param {string} value
 * @param {string} step
 * @returns {boolean}
 */
export function isMultipleOf(value, step) {
  const x = split(value);
  const y = split(step);
  const width = Math.max(x.frac.length, y.frac.length);
  const nx = BigInt(x.int + x.frac.padEnd(width, "0"));
  const ny = BigInt(y.int + y.frac.padEnd(width, "0"));
  return ny === 0n ? true : nx % ny === 0n;
}

/**
 * A decimal string as an integer count of minor units (cents for 2 digits).
 * `null` when the count is past `Number.MAX_SAFE_INTEGER`.
 * @param {string | number} value
 * @param {number} fractionDigits
 * @returns {number | null}
 */
export function toMinorUnits(value, fractionDigits) {
  const text = typeof value === "number" ? numberToDecimal(value) : value;
  if (!RE_DECIMAL.test(text)) return null;
  const rounded = roundDecimal(text, fractionDigits);
  const { negative, int, frac } = split(rounded);
  const scaled = BigInt(int + frac.padEnd(fractionDigits, "0"));
  if (scaled > MAX_SAFE) return null;
  return negative && scaled !== 0n ? -Number(scaled) : Number(scaled);
}

/**
 * An integer count of minor units as a decimal string.
 * @param {number} minor
 * @param {number} fractionDigits
 * @returns {string}
 */
export function fromMinorUnits(minor, fractionDigits) {
  const negative = minor < 0;
  const digits = String(Math.abs(minor)).padStart(fractionDigits + 1, "0");
  const cut = digits.length - fractionDigits;
  const out =
    digits.slice(0, cut) + (fractionDigits ? `.${digits.slice(cut)}` : "");
  return (negative ? "-" : "") + out;
}

/**
 * The fraction digits a currency uses (JPY 0, USD 2, BHD 3).
 * @param {string} currency
 * @param {string} [locale]
 * @returns {number}
 */
export function currencyFractionDigits(currency, locale) {
  return (
    getNumberFormatter(locale, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 0
  );
}

// --- The format -----------------------------------------------------------

/** @type {Map<string, NumberFormat>} */
const specs = new Map();

/**
 * Build the format for a locale and options. Pure and SSR-safe, and cached
 * by its options.
 * @param {NumberFormatOptions} [options]
 * @returns {NumberFormat}
 */
export function createNumberFormat(options = {}) {
  const key = JSON.stringify(options);
  const cached = specs.get(key);
  if (cached) return cached;
  const made = build(options);
  if (specs.size >= 64)
    specs.delete(/** @type {string} */ (specs.keys().next().value));
  specs.set(key, made);
  return made;
}

/**
 * @param {NumberFormatOptions} options
 * @returns {NumberFormat}
 */
function build(options) {
  const {
    locale,
    currency,
    currencyDisplay,
    currencySign,
    unitDisplay,
    useGrouping,
    allowNegative = false,
    maxIntegerDigits = 15,
  } = options;
  const unit = options.unit
    ? (UNIT_ALIASES[options.unit] ?? options.unit)
    : undefined;
  // A style without its currency or unit is a plain number.
  const wanted =
    options.style ?? (currency ? "currency" : unit ? "unit" : "decimal");
  const style =
    (wanted === "currency" && !currency) || (wanted === "unit" && !unit)
      ? "decimal"
      : wanted;

  /** @type {Intl.NumberFormatOptions} */
  const intl = { style };
  if (style === "currency") {
    intl.currency = currency;
    if (currencyDisplay) intl.currencyDisplay = currencyDisplay;
    if (currencySign) intl.currencySign = currencySign;
  }
  if (style === "unit") {
    intl.unit = unit;
    if (unitDisplay) intl.unitDisplay = unitDisplay;
  }
  // The `"always"`, `"auto"` and `"min2"` strings are newer than the types.
  if (useGrouping !== undefined) {
    intl.useGrouping = /** @type {boolean} */ (useGrouping);
  }
  if (options.minimumFractionDigits !== undefined)
    intl.minimumFractionDigits = options.minimumFractionDigits;
  if (options.maximumFractionDigits !== undefined)
    intl.maximumFractionDigits = options.maximumFractionDigits;

  const resolved = getNumberFormatter(locale, intl).resolvedOptions();
  const minFD = resolved.minimumFractionDigits ?? 0;
  const maxFD = resolved.maximumFractionDigits ?? 0;
  const resolvedLocale = resolved.locale;

  /** @param {number} fd */
  const formatterFor = (fd) =>
    getNumberFormatter(locale, {
      ...intl,
      minimumFractionDigits: fd,
      maximumFractionDigits: fd,
    });

  // What this locale and style use. Probed from the style itself: `fr-CH`
  // groups and marks decimals differently for money than for plain numbers.
  const probe = formatterFor(1).formatToParts(-1234567.5);
  const partValue = (/** @type {string} */ type) =>
    stripBidi(probe.find((p) => p.type === type)?.value ?? "");
  const group = partValue("group");
  const decimal = maxFD > 0 ? partValue("decimal") || "." : ".";
  const minus = partValue("minusSign");
  const accounting = !minus && probe[0]?.value === "(";

  // Text that is part of the format but not of the number: the symbol, the
  // unit, spaces. Paste accepts them and drops them.
  /** @type {Set<string>} */
  const affixSet = new Set();
  /** @param {Intl.NumberFormatOptions} o */
  const collect = (o) => {
    for (const sample of [1, 2, -1, 0.5, 1234567.5]) {
      const f = getNumberFormatter(locale, o);
      for (const p of f.formatToParts(sample)) {
        if (["literal", "currency", "unit", "percentSign"].includes(p.type)) {
          const v = stripBidi(p.value).trim();
          if (v && !RE_BRACKETS_ONLY.test(v) && !RE_ND.test(v)) affixSet.add(v);
        }
      }
    }
  };
  collect(intl);
  if (style === "unit") {
    for (const d of /** @type {const} */ (["short", "narrow", "long"]))
      collect({ ...intl, unitDisplay: d });
  }
  if (style === "currency") {
    for (const d of /** @type {const} */ ([
      "symbol",
      "narrowSymbol",
      "code",
      "name",
    ]))
      collect({ ...intl, currencyDisplay: d });
  }
  const affixes = [...affixSet].sort((a, b) => b.length - a.length);

  /**
   * Mark the text covered by an affix, so a "." inside an abbreviation such as `m.p.h.`
   * is not read as a decimal mark.
   * @param {string} text
   * @returns {boolean[]}
   */
  function coverage(text) {
    /** @type {boolean[]} */
    const covered = new Array(text.length).fill(false);
    for (const affix of affixes) {
      let from = 0;
      for (;;) {
        const at = text.indexOf(affix, from);
        if (at === -1) break;
        if (!covered[at])
          for (let i = at; i < at + affix.length; i++) covered[i] = true;
        from = at + affix.length;
      }
    }
    return covered;
  }

  /**
   * Walk the field's own text, as the format wrote it, into the raw string.
   * `map[i]` is the count of raw characters left of text index `i`.
   * @param {string} text
   * @returns {{ raw: string, map: number[] }}
   */
  function scan(text) {
    const covered = coverage(text);
    /** @type {number[]} */
    const map = new Array(text.length + 1);
    let raw = "";
    let digits = false;
    let dot = false;
    let signed = false;
    let i = 0;
    while (i < text.length) {
      const cp = /** @type {number} */ (text.codePointAt(i));
      const ch = String.fromCodePoint(cp);
      const width = ch.length;
      for (let k = 0; k < width; k++) map[i + k] = raw.length;
      if (!covered[i]) {
        const d = digitValue(ch);
        if (d >= 0) {
          raw += d;
          digits = true;
        } else if (ch === decimal && !dot && maxFD > 0) {
          raw += ".";
          dot = true;
        } else if (
          (DASHES.includes(ch) || (accounting && ch === "(")) &&
          !digits &&
          !dot &&
          !signed
        ) {
          raw = "-";
          signed = true;
        }
      }
      i += width;
    }
    map[text.length] = raw.length;
    return { raw, map };
  }

  /**
   * Normalize a raw string, keeping the caret (a raw index) on its character.
   * @param {string} input
   * @param {number} [caret]
   * @param {boolean} [limit] Drop integer digits past `maxIntegerDigits`.
   * @returns {{ raw: string, caret: number }}
   */
  function normalize(input, caret = input.length, limit = false) {
    let c = caret;
    let out = "";
    let dot = false;
    let ints = 0;
    let fracs = 0;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      let keep = false;
      if (ch === "-") {
        keep = out === "" && i === 0;
      } else if (ch === ".") {
        keep = !dot && maxFD > 0;
        if (keep) dot = true;
      } else if (ch >= "0" && ch <= "9") {
        if (dot) {
          keep = fracs < maxFD;
          if (keep) fracs++;
        } else {
          keep = !limit || ints < maxIntegerDigits;
          if (keep) ints++;
        }
      }
      if (keep) out += ch;
      else if (i < caret) c--;
    }
    const s = out.startsWith("-") ? 1 : 0;
    while (out[s] === "0" && RE_DIGIT.test(out[s + 1] ?? "")) {
      out = out.slice(0, s) + out.slice(s + 1);
      if (c > s) c--;
    }
    if (out[s] === ".") {
      out = `${out.slice(0, s)}0${out.slice(s)}`;
      if (c > s) c++;
    }
    return { raw: out, caret: Math.max(0, Math.min(c, out.length)) };
  }

  /**
   * The raw string as it is when the field is left: no dangling mark, the
   * minimum fraction digits, and no negative zero.
   * @param {string} raw
   * @returns {string}
   */
  function finalize(raw) {
    if (raw === "" || raw === "-") return "";
    let { raw: out } = normalize(raw);
    if (out.endsWith(".")) out = out.slice(0, -1);
    const [int, frac = ""] = out.split(".");
    const padded = frac.length < minFD ? frac.padEnd(minFD, "0") : frac;
    out = padded ? `${int}.${padded}` : int;
    if (out.startsWith("-") && RE_NEGATIVE_ZERO.test(out)) out = out.slice(1);
    return out;
  }

  /**
   * Write a raw string as text, with where each raw character ends.
   * @param {string} raw
   * @returns {{ text: string, ends: number[], first: number }}
   */
  function render(raw) {
    if (raw === "") return { text: "", ends: [], first: 0 };
    const negative = raw.startsWith("-");
    const body = negative ? raw.slice(1) : raw;
    if (body === "") {
      const mark = minus || "-";
      return { text: mark, ends: [mark.length], first: 0 };
    }
    const dotAt = body.indexOf(".");
    const int = dotAt === -1 ? body : body.slice(0, dotAt);
    const frac = dotAt === -1 ? "" : body.slice(dotAt + 1);
    const trailingDot = dotAt !== -1 && frac === "";
    // A decimal string, so a long amount keeps every digit (`Intl.NumberFormat`
    // v3: Chrome 106, Firefox 116, Safari 15.4).
    const decimalString = `${negative ? "-" : ""}${int || "0"}${frac ? `.${frac}` : ""}`;
    const parts = formatterFor(frac.length).formatToParts(
      /** @type {any} */ (decimalString),
    );
    let lastInt = -1;
    parts.forEach((p, i) => {
      if (p.type === "integer") lastInt = i;
    });
    /** @type {number[]} */
    const ends = new Array(raw.length);
    let text = "";
    let digitIndex = negative ? 1 : 0;
    let signSeen = !negative;
    let first = -1;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const value = stripBidi(p.value);
      if (p.type === "minusSign") {
        text += value;
        if (negative && !signSeen) {
          ends[0] = text.length;
          signSeen = true;
          if (first === -1) first = text.length - value.length;
        }
      } else if (p.type === "integer" || p.type === "fraction") {
        for (const ch of value) {
          if (first === -1) first = text.length;
          text += ch;
          ends[digitIndex++] = text.length;
        }
      } else if (p.type === "decimal") {
        text += value;
        ends[digitIndex++] = text.length;
      } else if (
        p.type === "literal" &&
        negative &&
        !signSeen &&
        accounting &&
        value.includes("(")
      ) {
        text += value;
        ends[0] = text.indexOf("(") + 1;
        signSeen = true;
        if (first === -1) first = text.indexOf("(");
      } else {
        text += value;
      }
      if (i === lastInt && trailingDot) {
        text += decimal;
        ends[digitIndex++] = text.length;
      }
    }
    // A sign the format has no mark for, which the text does not show.
    if (!signSeen) ends[0] = Math.max(0, first);
    return { text, ends, first: Math.max(0, first) };
  }

  /**
   * The text index after `count` raw characters.
   * @param {{ ends: number[], first: number }} rendered
   * @param {string} raw
   * @param {number} count
   * @returns {number}
   */
  function caretAt(rendered, raw, count) {
    const { ends, first } = rendered;
    if (count <= 0 || ends.length === 0) return first;
    let at = ends[Math.min(count, ends.length) - 1];
    // After the sign, stand before the digits and not before a symbol that
    // sits between them.
    if (raw[count - 1] === "-" && count < ends.length) {
      at = Math.max(at, ends[count] - 1);
    }
    return at;
  }

  /**
   * Read text the way a person writes it: this locale's marks, other
   * locales' marks, any digits, a sign in front, behind or as brackets.
   * @param {string} input
   * @returns {{ value: string, ambiguous: boolean } | null}
   */
  function parse(input) {
    let text = stripBidi(input).trim();
    if (text === "") return { value: "", ambiguous: false };
    let negative = false;
    if (RE_BRACKETED.test(text)) {
      negative = true;
      text = text.replace(/[()]/g, "");
    }
    const covered = coverage(text);
    let kept = "";
    for (let i = 0; i < text.length; i++) if (!covered[i]) kept += text[i];
    kept = kept.replace(RE_CURRENCY_SYMBOL, "");
    if (style === "currency") kept = kept.replace(RE_ISO_CODE, "");
    kept = kept.replace(/\s*%\s*/g, "");
    // Digits of any script, full-width marks.
    let s = "";
    for (const ch of kept) {
      const d = digitValue(ch);
      if (d >= 0) s += d;
      else if (ch === "\uff0e" || ch === "\u3002") s += ".";
      else if (ch === "\uff0c") s += ",";
      else s += ch;
    }
    s = s.trim();
    // A sign in front or behind.
    const lead = new RegExp(`^[${DASHES}]\\s*`);
    const trail = new RegExp(`\\s*[${DASHES}]$`);
    if (lead.test(s) && trail.test(s)) return null;
    if (lead.test(s) || trail.test(s)) {
      negative = true;
      s = s.replace(lead, "").replace(trail, "");
    }
    if (!RE_STARTS_NUMBER.test(s) || !RE_ENDS_NUMBER.test(s)) return null;
    if (RE_NOT_NUMBER.test(s)) return null;
    if (negative && !allowNegative) return null;

    let ambiguous = false;
    /** @type {string} */
    let int;
    let frac = "";
    const arabicDecimal = s.indexOf("\u066b");
    const marks = [...s]
      .map((ch, i) => ({ ch, i }))
      .filter((m) => m.ch === "." || m.ch === ",");
    /** @param {string} t */
    const digitsOf = (t) => t.replace(/[^0-9]/g, "");
    /**
     * Chunks between a mark: one to three digits, then two or three each
     * (Indian grouping is by twos).
     * @param {string} t
     * @param {string} sep
     */
    const groupsOk = (t, sep) =>
      t
        .split(sep)
        .every(
          (c, i) =>
            RE_DIGITS_ONLY.test(c) &&
            (i === 0 ? c.length <= 3 : c.length === 2 || c.length === 3),
        );
    if (arabicDecimal !== -1) {
      int = digitsOf(s.slice(0, arabicDecimal));
      frac = digitsOf(s.slice(arabicDecimal + 1));
    } else if (marks.length === 0) {
      int = digitsOf(s);
    } else {
      const kinds = new Set(marks.map((m) => m.ch));
      if (kinds.size === 2) {
        const last = marks[marks.length - 1];
        const other = last.ch === "." ? "," : ".";
        const lastCount = marks.filter((m) => m.ch === last.ch).length;
        const firstLast = marks.findIndex((m) => m.ch === last.ch);
        const lastOther = marks.map((m) => m.ch).lastIndexOf(other);
        if (lastCount !== 1 || lastOther > firstLast) return null;
        int = digitsOf(s.slice(0, last.i));
        frac = digitsOf(s.slice(last.i + 1));
      } else {
        const sep = /** @type {string} */ (marks[0].ch);
        if (marks.length > 1) {
          if (!groupsOk(s.replace(RE_SPACE_LIKE_G, ""), sep)) return null;
          int = digitsOf(s);
        } else {
          const at = marks[0].i;
          const before = digitsOf(s.slice(0, at));
          const after = digitsOf(s.slice(at + 1));
          const groupValid =
            after.length === 3 &&
            before.length >= 1 &&
            before.length <= 3 &&
            !before.startsWith("0");
          const decimalValid = after.length <= maxFD;
          // One mark and three digits after it reads as either. This
          // field's marks decide when both fit; when only grouping fits
          // (a third fraction digit is not allowed), it is grouping.
          ambiguous = groupValid;
          let asDecimal = true;
          if (groupValid) asDecimal = decimalValid && sep === decimal;
          if (asDecimal) {
            int = before;
            frac = after;
          } else {
            int = before + after;
          }
        }
      }
    }
    if (int === "" && frac === "") return null;
    let value = (int || "0") + (frac ? `.${frac}` : "");
    value = roundDecimal(value, maxFD);
    const out = normalize(value).raw;
    if (
      out.replace(RE_LEADING_MINUS, "").split(".")[0].length > maxIntegerDigits
    )
      return null;
    return { value: negative ? finalizeSign(`-${out}`) : out, ambiguous };
  }

  /** @param {string} raw */
  function finalizeSign(raw) {
    return RE_NEGATIVE_ZERO.test(raw) ? raw.slice(1) : raw;
  }

  /**
   * Take a bound value (a string or number) as a raw string.
   * @param {unknown} value
   * @returns {string}
   */
  function fromValue(value) {
    let text = "";
    if (typeof value === "number") text = numberToDecimal(value);
    else if (typeof value === "string") text = value.trim();
    if (!RE_DECIMAL.test(text)) return "";
    const rounded = roundDecimal(text, maxFD);
    return normalize(rounded).raw;
  }

  /**
   * @param {string} raw A raw string, or one `finalize` has seen.
   * @returns {string} The decimal string a field reports: no dangling mark.
   */
  function toValue(raw) {
    if (raw === "" || raw === "-") return "";
    const out = raw.endsWith(".") ? raw.slice(0, -1) : raw;
    return finalizeSign(out);
  }

  /**
   * One edit, as `beforeinput` describes it, applied to the field's text and
   * selection.
   * @param {{ value: string, start: number, end: number }} state
   * @param {NumberChange} change
   */
  function applyEdit(state, change) {
    const { raw, map } = scan(state.value);
    const lo = Math.min(state.start, state.end);
    const hi = Math.max(state.start, state.end);
    const at = (/** @type {number} */ i) =>
      map[Math.min(i, state.value.length)] ?? raw.length;
    let rs = at(lo);
    let re = at(hi);
    const before = render(raw);
    const signed = raw.startsWith("-");
    const dotAt = raw.indexOf(".");
    const hasFraction = dotAt !== -1 && dotAt < raw.length - 1;

    /** The text for `next`, with the caret after `count` raw characters. */
    const done = (/** @type {string} */ next, /** @type {number} */ count) => {
      const n = normalize(next, count);
      const rendered = render(n.raw);
      return {
        value: rendered.text,
        raw: n.raw,
        caret: caretAt(rendered, n.raw, n.caret),
        changed: rendered.text !== state.value,
      };
    };
    /** Only the caret moves. */
    const step = (/** @type {number} */ count) => ({
      value: state.value,
      raw,
      caret: caretAt(before, raw, count),
      changed: false,
    });
    /** The edit does nothing: the text and the selection stay. */
    const refuse = () => ({
      value: state.value,
      raw,
      caret: lo,
      changed: false,
    });

    if (change.type === "insert") {
      const typed = change.text;
      let piece = "";
      let pieceNegative = false;
      if ([...typed].length === 1) {
        const d = digitValue(typed);
        if (d >= 0) {
          piece = String(d);
        } else if (
          typed === "." ||
          typed === "," ||
          typed === "\u066b" ||
          typed === "\uff0e" ||
          typed === "\uff0c" ||
          typed === decimal
        ) {
          if (maxFD === 0) return refuse();
          if (dotAt !== -1 && !(dotAt >= rs && dotAt < re)) {
            // There is a decimal mark already: step over it when it is ahead.
            return dotAt >= re ? step(dotAt + 1) : refuse();
          }
          piece = ".";
        } else if (
          (DASHES.includes(typed) && allowNegative) ||
          (accounting && typed === "(" && allowNegative) ||
          (typed === "+" && signed)
        ) {
          // A sign key toggles the sign.
          const next = signed ? raw.slice(1) : `-${raw}`;
          const shift = signed ? -1 : 1;
          return done(next, Math.max(0, Math.min(next.length, rs + shift)));
        } else {
          return refuse();
        }
      } else {
        const parsed = parse(typed);
        if (!parsed || parsed.value === "") return refuse();
        pieceNegative = parsed.value.startsWith("-");
        piece = pieceNegative ? parsed.value.slice(1) : parsed.value;
        if (
          piece.includes(".") &&
          dotAt !== -1 &&
          !(dotAt >= rs && dotAt < re)
        ) {
          return refuse();
        }
      }
      // Digits go after the sign.
      if (signed && rs === 0) {
        rs = 1;
        re = Math.max(re, 1);
      }
      const merged = pieceNegative && !signed;
      const next = raw.slice(0, rs) + piece + raw.slice(re);
      // No room for it: nothing is pushed out of the field.
      const [intPart, fracPart = ""] = next.replace("-", "").split(".");
      if (
        fracPart.length > maxFD ||
        intPart.replace(RE_LEADING_ZEROS, "").length > maxIntegerDigits
      ) {
        return refuse();
      }
      const result = done(
        merged ? `-${next}` : next,
        rs + piece.length + (merged ? 1 : 0),
      );
      // No room for it: leave the field as it was.
      return !result.changed && rs === re ? refuse() : result;
    }

    // Deleting.
    let from = rs;
    let to = re;
    if (rs === re) {
      const { direction, unit } = change;
      const forward = direction === "forward";
      if (unit === "line") {
        if (forward) to = raw.length;
        else from = 0;
      } else if (unit === "word") {
        const body = signed ? 1 : 0;
        if (forward) {
          to = dotAt !== -1 && rs <= dotAt ? dotAt : raw.length;
          if (to === rs) to = raw.length;
        } else if (dotAt !== -1 && rs > dotAt) {
          from = dotAt + 1;
          if (from === rs) from = body;
        } else {
          from = rs <= body ? 0 : body;
        }
      } else if (forward) {
        if (rs >= raw.length) return refuse();
        // Do not fold the fraction into the integer part by accident.
        if (raw[rs] === "." && hasFraction) return step(rs + 1);
        to = rs + 1;
      } else {
        if (rs === 0) return refuse();
        if (raw[rs - 1] === "." && hasFraction) return step(rs - 1);
        from = rs - 1;
      }
    }
    if (from === to) return refuse();
    return done(raw.slice(0, from) + raw.slice(to), from);
  }

  /**
   * Re-read text the browser edited (a drop, autofill, a composition) and
   * write it in the format, keeping the caret among the digits.
   * @param {string} text
   * @param {number} caret
   * @param {boolean} [final] Also pad the fraction digits, as on blur.
   */
  function conform(text, caret, final = false) {
    const { raw: scanned, map } = scan(text);
    let raw = scanned;
    // Text the format wrote reads back as it is. Anything else (autofill, a
    // drop, a keyboard) is read as a person would write it.
    if (render(scanned).text !== text) {
      const parsed = parse(text);
      raw = parsed ? parsed.value : scanned;
    }
    if (!allowNegative && raw.startsWith("-")) raw = raw.slice(1);
    const count = Math.min(
      map[Math.min(caret, text.length)] ?? raw.length,
      raw.length,
    );
    const n = normalize(raw, count, true);
    if (final) n.raw = finalize(n.raw);
    const rendered = render(n.raw);
    return {
      value: rendered.text,
      raw: n.raw,
      caret: caretAt(rendered, n.raw, n.caret),
    };
  }

  const direction = localeDirection(resolvedLocale);

  return {
    locale: resolvedLocale,
    style,
    currency,
    unit,
    decimal,
    group,
    minimumFractionDigits: minFD,
    maximumFractionDigits: maxFD,
    allowNegative,
    accounting,
    direction,
    scan,
    normalize: (raw) => normalize(raw).raw,
    finalize,
    parse,
    toValue,
    fromValue,
    /** @param {unknown} value */
    format(value) {
      return render(finalize(fromValue(value))).text;
    },
    /** @param {string} raw */
    render(raw) {
      return render(raw).text;
    },
    applyEdit,
    conform,
    name() {
      try {
        if (style === "currency" && currency) {
          return (
            new Intl.DisplayNames(locale, { type: "currency" }).of(currency) ??
            currency
          );
        }
        if (style === "unit") {
          const long = getNumberFormatter(locale, {
            ...intl,
            unitDisplay: "long",
          })
            .formatToParts(2)
            .find((p) => p.type === "unit");
          return long ? long.value : (unit ?? "");
        }
      } catch {
        // Intl.DisplayNames is missing: no name.
      }
      return "";
    },
  };
}
