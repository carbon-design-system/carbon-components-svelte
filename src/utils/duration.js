// @ts-check
// Duration math for DurationInput: split a total into segments, step a
// segment with carry, parse "1h 30m", "1:30" and ISO 8601, and format.
import { getNumberFormatter } from "./intl-formatter-cache.js";

/**
 * @typedef {"day" | "hour" | "minute" | "second" | "millisecond"} DurationUnit
 */

/** @type {readonly DurationUnit[]} */
export const DURATION_UNITS = [
  "day",
  "hour",
  "minute",
  "second",
  "millisecond",
];

/** @type {Record<DurationUnit, number>} */
export const UNIT_MS = {
  day: 86_400_000,
  hour: 3_600_000,
  minute: 60_000,
  second: 1000,
  millisecond: 1,
};

/** How many of a unit make one of the unit above it. */
const PER_PARENT = { hour: 24, minute: 60, second: 60, millisecond: 1000 };

/**
 * The units a field shows, largest first. A smallest unit above the
 * largest collapses to the largest.
 *
 * @param {DurationUnit} largest
 * @param {DurationUnit} smallest
 * @returns {DurationUnit[]}
 */
export function unitRange(largest, smallest) {
  const from = Math.max(DURATION_UNITS.indexOf(largest), 0);
  const to = Math.max(DURATION_UNITS.indexOf(smallest), from);
  return DURATION_UNITS.slice(from, to + 1);
}

/**
 * Splits a total into one count per unit. The largest unit takes
 * everything above it; what is left below the smallest unit is dropped.
 *
 * @param {number} total milliseconds
 * @param {readonly DurationUnit[]} units
 * @returns {Partial<Record<DurationUnit, number>>}
 */
export function splitDuration(total, units) {
  let rest = Math.max(0, Math.round(total));
  /** @type {Partial<Record<DurationUnit, number>>} */
  const parts = {};
  for (const unit of units) {
    const count = Math.floor(rest / UNIT_MS[unit]);
    parts[unit] = count;
    rest -= count * UNIT_MS[unit];
  }
  return parts;
}

/**
 * @param {Partial<Record<DurationUnit, number | null>>} parts
 * @returns {number} milliseconds
 */
export function joinDuration(parts) {
  let total = 0;
  for (const unit of DURATION_UNITS)
    total += (parts[unit] ?? 0) * UNIT_MS[unit];
  return total;
}

/**
 * The highest count a segment takes: 59 for minutes under hours, and for the
 * largest unit whatever `max` allows.
 *
 * @param {DurationUnit} unit
 * @param {readonly DurationUnit[]} units
 * @param {number | undefined} max total, in milliseconds
 */
export function segmentMax(unit, units, max) {
  if (unit === units[0]) {
    return max == null
      ? Number.POSITIVE_INFINITY
      : Math.floor(max / UNIT_MS[unit]);
  }
  return PER_PARENT[/** @type {keyof typeof PER_PARENT} */ (unit)] - 1;
}

/**
 * @param {number} value
 * @param {number | undefined} min
 * @param {number | undefined} max
 */
export function clampDuration(value, min, max) {
  const upper = max ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min ?? 0), Math.max(upper, min ?? 0));
}

/**
 * Rounds a total to the nearest multiple of `step` smallest units.
 *
 * @param {number} total milliseconds
 * @param {DurationUnit} smallest
 * @param {number} [step=1]
 */
export function snapDuration(total, smallest, step = 1) {
  const size = UNIT_MS[smallest] * Math.max(1, step);
  return Math.round(total / size) * size;
}

/**
 * The total after stepping one segment. The step carries into the segments
 * above (59m + 1 is 1h 0m) and borrows from them. The smallest segment moves
 * to the next multiple of `step`; the others move by one.
 *
 * @param {number | null} total milliseconds
 * @param {DurationUnit} unit the segment being stepped
 * @param {1 | -1} direction
 * @param {{ smallest: DurationUnit; step?: number; min?: number; max?: number; count?: number }} options
 * `count` repeats the step, for PageUp and PageDown.
 * @returns {number}
 */
export function stepDuration(total, unit, direction, options) {
  const { smallest } = options;
  // What the field shows: anything below the smallest unit is cut off.
  const current =
    Math.floor((total ?? 0) / UNIT_MS[smallest]) * UNIT_MS[smallest];
  const count = options.count ?? 1;
  let next;
  if (unit === smallest) {
    const size = UNIT_MS[unit] * Math.max(1, options.step ?? 1);
    const rest = current % size;
    // Off the step grid, the first step lands on it.
    next =
      direction > 0
        ? current - rest + size * count
        : rest === 0
          ? current - size * count
          : current - rest - size * (count - 1);
  } else {
    next = current + direction * count * UNIT_MS[unit];
  }
  return clampDuration(next, options.min, options.max);
}

/**
 * Applies one typed digit to a segment.
 *
 * A digit that would push the count past `limit` starts over with itself,
 * and a segment is done once no further digit could fit.
 *
 * @param {string} buffer digits typed into the segment so far
 * @param {string} digit
 * @param {number} limit the highest count the segment takes
 * @param {number} maxDigits
 * @returns {{ buffer: string; count: number; done: boolean }}
 */
export function typeDigit(buffer, digit, limit, maxDigits) {
  let next = buffer + digit;
  if (Number(next) > limit || next.length > maxDigits) next = digit;
  const count = Math.min(Number(next), limit);
  return {
    buffer: next,
    count,
    done: next.length >= maxDigits || count * 10 > limit,
  };
}

/**
 * Digits a segment has room for. A segment with no limit takes two, so
 * `245` types as 2h 45m; larger counts come from the arrow keys, a paste or
 * a `max`.
 *
 * @param {number} limit the highest count the segment takes
 */
export function segmentDigits(limit) {
  return Number.isFinite(limit) ? String(limit).length : 2;
}

/**
 * ASCII digits for the Arabic-Indic, Persian, Devanagari, Bengali and
 * fullwidth ones, which a local keyboard or an IME types.
 *
 * @param {string} text
 */
export function asciiDigits(text) {
  return text.replace(/\p{Nd}/gu, (char) => {
    const code = /** @type {number} */ (char.codePointAt(0));
    for (const zero of [0x660, 0x6f0, 0x966, 0x9e6, 0xff10]) {
      if (code >= zero && code <= zero + 9) return String(code - zero);
    }
    return char;
  });
}

/** @type {[DurationUnit, RegExp][]} */
const UNIT_WORDS = [
  ["millisecond", /^(ms|msecs?|milliseconds?)$/],
  ["day", /^(d|days?)$/],
  ["hour", /^(h|hrs?|hours?)$/],
  ["minute", /^(m|mins?|minutes?)$/],
  ["second", /^(s|secs?|seconds?)$/],
];

/** @param {string} text */
const decimal = (text) => Number(text.replace(",", "."));

const ISO_DURATION =
  /^p(?:(\d+(?:[.,]\d+)?)w)?(?:(\d+(?:[.,]\d+)?)d)?(?:t(?:(\d+(?:[.,]\d+)?)h)?(?:(\d+(?:[.,]\d+)?)m)?(?:(\d+(?:[.,]\d+)?)s)?)?$/;
const CLOCK = /^(\d+):(\d{1,2})(?::(\d{1,2})(?:[.,](\d{1,3}))?)?$/;
const TOKEN = /(\d+(?:[.,]\d+)?|[.,]\d+)\s*([a-z]*)/g;

/**
 * Reads a typed duration into milliseconds. `undefined` means the text is
 * not a duration; an empty string is `null`.
 *
 * Accepts `1h 30m`, `1 hour, 30 minutes`, `90m`, `1.5h`, `1d 2h`, `1:30`
 * (hours and minutes), `1:30:15`, `1:30:15.250`, and ISO 8601 `PT1H30M` or
 * `P1DT2H`. A bare number counts in `bareUnit`. Months and years are not
 * durations of a fixed length, so `P1M` is not accepted.
 *
 * @param {string} text
 * @param {DurationUnit} [bareUnit="minute"]
 * @returns {number | null | undefined}
 */
export function parseDuration(text, bareUnit = "minute") {
  const input = asciiDigits(text).trim().toLowerCase();
  if (input === "") return null;

  const iso = ISO_DURATION.exec(input);
  if (iso) {
    const [, w, d, h, m, s] = iso;
    if (
      iso.slice(1).every((part) => part === undefined) ||
      input.endsWith("t")
    ) {
      return undefined;
    }
    return Math.round(
      (w ? decimal(w) * 7 * UNIT_MS.day : 0) +
        (d ? decimal(d) * UNIT_MS.day : 0) +
        (h ? decimal(h) * UNIT_MS.hour : 0) +
        (m ? decimal(m) * UNIT_MS.minute : 0) +
        (s ? decimal(s) * UNIT_MS.second : 0),
    );
  }

  const clock = CLOCK.exec(input);
  if (clock) {
    const [, h, m, s, ms] = clock;
    if (Number(m) > 59 || Number(s ?? 0) > 59) return undefined;
    return (
      Number(h) * UNIT_MS.hour +
      Number(m) * UNIT_MS.minute +
      Number(s ?? 0) * UNIT_MS.second +
      Number((ms ?? "").padEnd(3, "0") || 0)
    );
  }

  /** @type {Set<DurationUnit>} */
  const seen = new Set();
  let total = 0;
  const tokens = [...input.matchAll(TOKEN)];
  if (tokens.length === 0) return undefined;
  const rest = input.replace(TOKEN, "").replace(/\band\b|[\s,&]/g, "");
  if (rest !== "") return undefined;
  for (const [, amount, word] of tokens) {
    /** @type {DurationUnit | undefined} */
    let unit;
    if (word === "") {
      if (tokens.length > 1) return undefined;
      unit = bareUnit;
    } else {
      unit = UNIT_WORDS.find(([, pattern]) => pattern.test(word))?.[0];
    }
    if (!unit || seen.has(unit)) return undefined;
    seen.add(unit);
    total += decimal(amount) * UNIT_MS[unit];
  }
  return Math.round(total);
}

/**
 * ISO 8601, such as `PT1H30M`. Days are the largest unit used.
 *
 * @param {number} total milliseconds
 * @returns {string}
 */
export function formatISODuration(total) {
  const parts = splitDuration(total, DURATION_UNITS);
  const seconds = (parts.second ?? 0) + (parts.millisecond ?? 0) / 1000;
  const date = parts.day ? `${parts.day}D` : "";
  const time =
    (parts.hour ? `${parts.hour}H` : "") +
    (parts.minute ? `${parts.minute}M` : "") +
    (seconds ? `${seconds}S` : "");
  if (!date && !time) return "PT0S";
  return `P${date}${time ? `T${time}` : ""}`;
}

/** @type {Record<DurationUnit, string>} */
const COMPACT = {
  day: "d",
  hour: "h",
  minute: "m",
  second: "s",
  millisecond: "ms",
};

/**
 * The text a text field shows, in the syntax it reads back: `1h 30m`.
 * Units with a zero count are left out, except the smallest when the whole
 * duration is zero.
 *
 * @param {number} total milliseconds
 * @param {readonly DurationUnit[]} units
 */
export function formatCompactDuration(total, units) {
  const parts = splitDuration(total, units);
  const shown = units.filter((unit) => parts[unit]);
  if (shown.length === 0) {
    const smallest = units[units.length - 1];
    return `0${COMPACT[smallest]}`;
  }
  return shown.map((unit) => `${parts[unit]}${COMPACT[unit]}`).join(" ");
}

/**
 * @typedef {{ locale?: string; style?: "long" | "short" | "narrow" }} DurationFormatOptions
 */

/**
 * The duration in words for a locale: "1 hour, 30 minutes". Uses
 * `Intl.DurationFormat` where the engine has it, and otherwise joins
 * `Intl.NumberFormat` unit amounts with `Intl.ListFormat`.
 *
 * @param {number} total milliseconds
 * @param {readonly DurationUnit[]} units the units to write, largest first
 * @param {DurationFormatOptions} [options]
 */
export function formatDuration(total, units, options = {}) {
  const { locale, style = "long" } = options;
  const parts = splitDuration(total, units);
  let shown = units.filter((unit) => parts[unit]);
  if (shown.length === 0) shown = [units[units.length - 1]];

  const Native = /** @type {any} */ (Intl).DurationFormat;
  if (typeof Native === "function") {
    /** @type {Record<string, number>} */
    const input = {};
    /** @type {Record<string, string>} */
    const always = {};
    for (const unit of shown) {
      input[`${unit}s`] = parts[unit] ?? 0;
      always[`${unit}sDisplay`] = "always";
    }
    return new Native(locale, { style, ...always }).format(input);
  }

  const pieces = shown.map((unit) =>
    getNumberFormatter(locale, {
      style: "unit",
      unit,
      unitDisplay: style,
    }).format(parts[unit] ?? 0),
  );
  const List = /** @type {any} */ (Intl).ListFormat;
  if (typeof List === "function") {
    return new List(locale, { type: "unit", style }).format(pieces);
  }
  return pieces.join(", ");
}

/**
 * The label for a unit in a locale: `h`, `Std.`, `時間`.
 *
 * @param {DurationUnit} unit
 * @param {string | undefined} locale
 * @param {"long" | "short" | "narrow"} display
 * @param {number} [count] picks the plural form of a long label
 */
export function unitLabel(unit, locale, display, count = 5) {
  const formatted = getNumberFormatter(locale, {
    style: "unit",
    unit,
    unitDisplay: display,
  }).formatToParts(count);
  return formatted
    .filter((part) => part.type === "unit")
    .map((part) => part.value)
    .join("")
    .trim();
}
