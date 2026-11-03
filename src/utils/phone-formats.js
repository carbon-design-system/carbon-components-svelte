// @ts-check
// National number formats for a phone field: a mask pattern per country for
// about 40 countries, and a grouping by threes for the rest. This is how a
// number is written and grouped, not which numbers exist: a number plan
// (area codes, mobile ranges, lengths) is libphonenumber's job and is far
// larger. `min` is the fewest digits a complete number has, where lengths
// vary.
//
// A `0` in a pattern is the trunk prefix. The mask takes a typed `0` as that
// literal, so the user can write the national form ("020 7946 0958") and
// the digits that are kept, and sent, are the international ones.

import { callingCode, splitCallingCode } from "./calling-codes.js";

/** The North American plan covers every region that calls with +1. */
const NANP = "(999) 999-9999";

/** @type {Record<string, string | [string, number]>} */
const FORMATS = {
  US: NANP,
  GB: ["099 9999 9999", 9],
  DE: ["099 999999999", 7],
  FR: "09 99 99 99 99",
  IT: ["999 99999999", 9],
  ES: "999 99 99 99",
  NL: "09 99999999",
  BE: ["0999 99 99 99", 8],
  CH: "099 999 99 99",
  AT: ["0999 99999999", 7],
  SE: ["099 999 99 99", 7],
  NO: "999 99 999",
  DK: "99 99 99 99",
  FI: ["099 999 9999", 8],
  PL: "999 999 999",
  PT: "999 999 999",
  IE: ["099 999 9999", 7],
  AU: "0999 999 999",
  NZ: ["099 999 99999", 8],
  IN: "99999 99999",
  JP: "099-9999-9999",
  CN: "999 9999 9999",
  KR: ["099-9999-9999", 9],
  SG: "9999 9999",
  HK: "9999 9999",
  BR: ["(99) 99999-9999", 10],
  MX: "999 999 9999",
  AR: ["99 9999-99999", 10],
  ZA: "099 999 9999",
  AE: "099 999 9999",
  IL: "099-999-9999",
  TR: "0999 999 99 99",
  RU: "(999) 999-99-99",
  UA: "099 999 99 99",
  CZ: "999 999 999",
  GR: "999 999 9999",
  HU: ["099 999 9999", 8],
  RO: "0999 999 999",
  SA: "099 999 9999",
  EG: ["099 9999 9999", 9],
  NG: ["0999 999 9999", 8],
  KE: "0999 999999",
};

/** The longest E.164 number has 15 digits, including the country's code. */
const MAX_DIGITS = 15;

/**
 * Groups of three, for a country with no entry, cut to what E.164 allows.
 * @param {number} digits
 * @returns {string}
 */
function generic(digits) {
  let pattern = "";
  for (let i = 0; i < digits; i++) pattern += i && i % 3 === 0 ? " 9" : "9";
  return pattern;
}

/**
 * @typedef {object} PhoneFormat
 * @property {string} pattern A mask pattern for the national number.
 * @property {number} min The fewest digits of a complete number.
 * @property {number} max The most digits the pattern takes.
 * @property {boolean} known False for the grouping by threes.
 */

/**
 * How a country writes its national numbers.
 * @param {string} region An ISO 3166 alpha-2 code.
 * @returns {PhoneFormat}
 */
export function phoneFormat(region) {
  const code = callingCode(region);
  const entry = code === "1" ? NANP : FORMATS[region.toUpperCase()];
  const known = entry !== undefined;
  const [pattern, min] = known
    ? typeof entry === "string"
      ? [entry, 0]
      : entry
    : [generic(Math.max(MAX_DIGITS - code.length, 1)), 6];
  const max = pattern.split("9").length - 1;
  return { pattern, min: min || max, max, known };
}

/**
 * The calling code and national digits of an international number, such as
 * "+44 20 7946 0958". `null` when it has no leading `+` or no known code.
 * @param {string} text
 * @returns {{ code: string; digits: string } | null}
 */
export function parseInternational(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("+")) return null;
  const split = splitCallingCode(trimmed.replace(/\D/g, ""));
  return split ? { code: split.code, digits: split.rest } : null;
}
