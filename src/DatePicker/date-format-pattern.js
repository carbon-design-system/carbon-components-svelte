// @ts-check

const REGEX_SPECIAL_CHARS = /[/\\^$*+?.()|[\]{}]/g;

/** @type {Record<string, string>} */
const dateFormatTokens = {
  d: "\\d{1,2}",
  j: "\\d{1,2}",
  m: "\\d{1,2}",
  n: "\\d{1,2}",
  Y: "\\d{4}",
  Q: "[1-4]",
  y: "\\d{2}",
  F: "\\w+",
  M: "\\w+",
  D: "\\w+",
  l: "\\w+",
  H: "\\d{1,2}",
  G: "\\d{1,2}",
  h: "\\d{1,2}",
  i: "\\d{1,2}",
  S: "\\d{1,2}",
  s: "\\d{1,2}",
  // AM/PM names can hold spaces and periods ("p. m."), but never digits.
  K: "\\D+",
};

/**
 * The input's `pattern` for a `dateFormat`.
 *
 * @param {string} fmt
 */
export function dateFormatToPattern(fmt) {
  let result = "";
  for (let i = 0; i < fmt.length; i++) {
    const ch = fmt[i];
    if (ch === "\\" && i + 1 < fmt.length) {
      result += fmt[++i].replace(REGEX_SPECIAL_CHARS, "\\$&");
    } else if (dateFormatTokens[ch]) {
      result += dateFormatTokens[ch];
    } else {
      result += ch.replace(REGEX_SPECIAL_CHARS, "\\$&");
    }
  }
  return result;
}

/**
 * `datePickerType="multiple"` joins each selected date with Flatpickr's
 * default `", "` conjunction into one input value, so the derived pattern
 * must allow one or more repetitions instead of a single date.
 *
 * @param {string} fmt
 */
export function dateFormatToMultiplePattern(fmt) {
  const single = dateFormatToPattern(fmt);
  return `${single}(, ${single})*`;
}
