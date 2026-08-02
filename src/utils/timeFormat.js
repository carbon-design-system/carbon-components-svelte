// @ts-check
// TimePicker string parse, validate, and format helpers.

/**
 * @typedef {"12" | "24"} TimeFormat
 */

/**
 * @typedef {object} TimeInputPreset
 * @property {string} pattern
 * @property {string} placeholder
 * @property {number} maxlength
 */

/**
 * @typedef {object} ParsedTime
 * @property {boolean} valid
 * @property {string} value - Normalized `hh:mm` / `hh:mm:ss` when valid; otherwise the input.
 * @property {number | null} hours
 * @property {number | null} minutes
 * @property {number | null} seconds
 */

const RE_TIME_CHARS = /^[0-9:]+$/;
const RE_ONE_OR_TWO_DIGITS = /^\d{1,2}$/;

/** @type {Readonly<Record<TimeFormat, { withSeconds: TimeInputPreset; withoutSeconds: TimeInputPreset }>>} */
const PRESETS = {
  12: {
    withoutSeconds: {
      // Optional leading zero so normalized values like `09:30` remain valid.
      pattern: "(0?[1-9]|1[012]):[0-5][0-9](\\s)?",
      placeholder: "hh:mm",
      maxlength: 5,
    },
    withSeconds: {
      pattern: "(0?[1-9]|1[012]):[0-5][0-9]:[0-5][0-9](\\s)?",
      placeholder: "hh:mm:ss",
      maxlength: 8,
    },
  },
  24: {
    withoutSeconds: {
      pattern: "([01]?[0-9]|2[0-3]):[0-5][0-9](\\s)?",
      placeholder: "hh:mm",
      maxlength: 5,
    },
    withSeconds: {
      pattern: "([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\s)?",
      placeholder: "hh:mm:ss",
      maxlength: 8,
    },
  },
};

/**
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return n.toString().padStart(2, "0");
}

/**
 * Pattern / placeholder / maxlength for a `format` + `seconds` combination.
 *
 * @param {TimeFormat} format
 * @param {boolean} [seconds]
 * @returns {TimeInputPreset}
 */
export function getTimeInputPreset(format, seconds = false) {
  const group = PRESETS[format] ?? PRESETS["12"];
  return seconds ? group.withSeconds : group.withoutSeconds;
}

/**
 * @param {number} hours
 * @param {TimeFormat} format
 * @returns {boolean}
 */
function isHourValid(hours, format) {
  if (format === "24") return hours >= 0 && hours <= 23;
  return hours >= 1 && hours <= 12;
}

/**
 * @param {number} hours
 * @param {number} minutes
 * @param {number | null} secs
 * @param {boolean} includeSeconds
 * @returns {string}
 */
function formatParts(hours, minutes, secs, includeSeconds) {
  const base = `${pad2(hours)}:${pad2(minutes)}`;
  if (!includeSeconds) return base;
  return `${base}:${pad2(secs ?? 0)}`;
}

/**
 * @param {string} raw
 * @param {TimeFormat} format
 * @param {boolean} includeSeconds
 * @returns {ParsedTime}
 */
function invalidResult(raw) {
  return {
    valid: false,
    value: raw,
    hours: null,
    minutes: null,
    seconds: null,
  };
}

/**
 * Parse digit-only input into hour / minute / optional second parts.
 *
 * @param {string} digits
 * @param {boolean} includeSeconds
 * @returns {{ hours: number; minutes: number; seconds: number | null } | null}
 */
function parseDigits(digits, includeSeconds) {
  const len = digits.length;

  if (includeSeconds) {
    if (len === 1 || len === 2) {
      return { hours: Number(digits), minutes: 0, seconds: 0 };
    }
    if (len === 3) {
      return {
        hours: Number(digits.slice(0, 1)),
        minutes: Number(digits.slice(1)),
        seconds: 0,
      };
    }
    if (len === 4) {
      return {
        hours: Number(digits.slice(0, 2)),
        minutes: Number(digits.slice(2)),
        seconds: 0,
      };
    }
    if (len === 5) {
      return {
        hours: Number(digits.slice(0, 1)),
        minutes: Number(digits.slice(1, 3)),
        seconds: Number(digits.slice(3)),
      };
    }
    if (len === 6) {
      return {
        hours: Number(digits.slice(0, 2)),
        minutes: Number(digits.slice(2, 4)),
        seconds: Number(digits.slice(4)),
      };
    }
    return null;
  }

  if (len === 1 || len === 2) {
    return { hours: Number(digits), minutes: 0, seconds: null };
  }
  if (len === 3) {
    // `930` → 9:30
    return {
      hours: Number(digits.slice(0, 1)),
      minutes: Number(digits.slice(1)),
      seconds: null,
    };
  }
  if (len === 4) {
    return {
      hours: Number(digits.slice(0, 2)),
      minutes: Number(digits.slice(2)),
      seconds: null,
    };
  }
  return null;
}

/**
 * Parse and validate a time string. Empty input is valid with null parts.
 *
 * Accepts colon-separated values and compact digit strings (`930` → 9:30).
 *
 * @param {string} raw
 * @param {{ format?: TimeFormat; seconds?: boolean }} [options]
 * @returns {ParsedTime}
 */
export function parseTime(raw, options = {}) {
  const format = options.format ?? "12";
  const includeSeconds = options.seconds === true;
  const trimmed = raw.trim();

  if (trimmed === "") {
    return {
      valid: true,
      value: "",
      hours: null,
      minutes: null,
      seconds: null,
    };
  }

  if (!RE_TIME_CHARS.test(trimmed)) {
    return invalidResult(raw);
  }

  /** @type {number} */
  let hours;
  /** @type {number} */
  let minutes;
  /** @type {number | null} */
  let secs = null;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const expected = includeSeconds ? 3 : 2;
    // Allow hh:mm when seconds are enabled (seconds default to 0).
    if (parts.length !== 2 && parts.length !== expected) {
      return invalidResult(raw);
    }
    if (parts.some((part) => part === "" || !RE_ONE_OR_TWO_DIGITS.test(part))) {
      return invalidResult(raw);
    }
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    if (includeSeconds) {
      secs = parts.length === 3 ? Number(parts[2]) : 0;
    }
  } else {
    const parsed = parseDigits(trimmed, includeSeconds);
    if (!parsed) return invalidResult(raw);
    hours = parsed.hours;
    minutes = parsed.minutes;
    secs = parsed.seconds;
  }

  if (!isHourValid(hours, format)) return invalidResult(raw);
  if (minutes < 0 || minutes > 59) return invalidResult(raw);
  if (includeSeconds && (secs === null || secs < 0 || secs > 59)) {
    return invalidResult(raw);
  }

  return {
    valid: true,
    value: formatParts(hours, minutes, secs, includeSeconds),
    hours,
    minutes,
    seconds: includeSeconds ? secs : null,
  };
}

/**
 * Format hour / minute / optional second parts to a display string.
 *
 * @param {number} hours
 * @param {number} minutes
 * @param {{ format?: TimeFormat; seconds?: number | boolean }} [options]
 * @returns {string | null} `null` when the parts are out of range.
 */
export function formatTime(hours, minutes, options = {}) {
  const format = options.format ?? "12";
  const includeSeconds =
    typeof options.seconds === "number" || options.seconds === true;
  const secs = typeof options.seconds === "number" ? options.seconds : 0;

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (
    includeSeconds &&
    typeof options.seconds === "number" &&
    !Number.isInteger(options.seconds)
  )
    return null;
  if (!isHourValid(hours, format)) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (includeSeconds && (secs < 0 || secs > 59)) return null;

  return formatParts(
    hours,
    minutes,
    includeSeconds ? secs : null,
    includeSeconds,
  );
}

/**
 * Whether `raw` is a valid time for the given options.
 *
 * @param {string} raw
 * @param {{ format?: TimeFormat; seconds?: boolean }} [options]
 * @returns {boolean}
 */
export function isValidTime(raw, options = {}) {
  return parseTime(raw, options).valid;
}
