// @ts-check

/**
 * The function registry: what a formula may call, and the built-in set.
 *
 * A function is data: a name, its parameters and what it returns drive the
 * checker, the completions and the signature help; an optional `evaluate`
 * drives the preview. Nothing here runs text as code.
 * @module
 */

/** @typedef {number | string | boolean | null} FormulaValue */

/** @typedef {"number" | "string" | "boolean" | "any"} FormulaType */

/**
 * @typedef {object} FormulaParam
 * @property {string} name
 * @property {FormulaType} [type] - Default `"any"`.
 * @property {boolean} [optional] - May be left out. Only trailing parameters.
 * @property {boolean} [rest] - Takes any number of arguments, at least one. Only the last parameter.
 * @property {string} [description]
 */

/**
 * @typedef {object} FormulaCallContext
 * @property {(message: string, code?: string) => never} fail - Stop the evaluation with an error.
 * @property {(units: number) => void} charge - Count `units` steps of work, so a costly function stays inside the step limit.
 * @property {number} maxStringLength - The longest text a function may build.
 */

/**
 * @typedef {object} FormulaFunction
 * @property {string} name - Matched without regard to case.
 * @property {FormulaParam[]} params
 * @property {FormulaType} [returns] - Default `"any"`.
 * @property {string} [signature] - Shown instead of the one built from `params`.
 * @property {string} [description]
 * @property {(args: FormulaValue[], context: FormulaCallContext) => FormulaValue} [evaluate] - Gets the value of every argument. Without this or `evaluateLazy`, the formula has no preview.
 * @property {(args: Array<() => FormulaValue>, context: FormulaCallContext) => FormulaValue} [evaluateLazy] - Gets a function per argument, and calls only the ones it needs. Wins over `evaluate`.
 */

export class FormulaError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {number} [start]
   * @param {number} [end]
   */
  constructor(message, code = "value", start = -1, end = -1) {
    super(message);
    this.name = "FormulaError";
    this.code = code;
    this.start = start;
    this.end = end;
  }
}

/**
 * @param {string} message
 * @param {string} [code]
 * @returns {never}
 */
function fail(message, code) {
  throw new FormulaError(message, code);
}

/**
 * Index a list of functions by upper-cased name. A later function replaces an
 * earlier one of the same name, so a list can override a built-in.
 * @param {ReadonlyArray<FormulaFunction>} functions
 * @returns {Map<string, FormulaFunction>}
 */
export function createFunctionMap(functions) {
  const map = new Map();
  for (const fn of functions) map.set(fn.name.toUpperCase(), fn);
  return map;
}

/**
 * The smallest and largest number of arguments `fn` takes.
 * @param {FormulaFunction} fn
 * @returns {{ min: number, max: number }}
 */
export function arity(fn) {
  let min = 0;
  let max = 0;
  for (const param of fn.params) {
    max += 1;
    if (param.rest) {
      min += 1;
      max = Number.POSITIVE_INFINITY;
    } else if (!param.optional) min += 1;
  }
  return { min, max };
}

/**
 * The parameter an argument at `index` fills. Past the end it is the rest
 * parameter, if there is one.
 * @param {FormulaFunction} fn
 * @param {number} index
 * @returns {number} the parameter's index, or -1
 */
export function paramIndexAt(fn, index) {
  const last = fn.params.length - 1;
  if (index <= last) return index;
  return last >= 0 && fn.params[last].rest ? last : -1;
}

/**
 * @typedef {object} FormulaSignature
 * @property {string} text - `ROUND(number, [digits])`.
 * @property {{ start: number, end: number }[]} params - Where each parameter is in `text`.
 */

/**
 * The signature of `fn` as text, with the range of each parameter in it.
 * @param {FormulaFunction} fn
 * @returns {FormulaSignature}
 */
export function formatSignature(fn) {
  /** @type {{ start: number, end: number }[]} */
  const params = [];

  if (fn.signature) {
    let from = fn.signature.indexOf("(") + 1;
    for (const param of fn.params) {
      const at = fn.signature.indexOf(param.name, from);
      if (at < 0) {
        params.push({ start: 0, end: 0 });
      } else {
        params.push({ start: at, end: at + param.name.length });
        from = at + param.name.length;
      }
    }
    return { text: fn.signature, params };
  }

  let text = `${fn.name.toUpperCase()}(`;
  fn.params.forEach((param, i) => {
    if (i > 0) text += ", ";
    const prefix = param.rest ? "..." : "";
    const label = param.optional ? `[${param.name}]` : param.name;
    params.push({
      start: text.length,
      end: text.length + prefix.length + label.length,
    });
    text += prefix + label;
  });
  return { text: `${text})`, params };
}

/**
 * @param {FormulaValue} value
 * @returns {boolean}
 */
export function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value !== "";
  return false;
}

/**
 * Text as a formula shows it: a number to 15 significant digits, so 0.1 + 0.2
 * is "0.3".
 * @param {FormulaValue} value
 * @returns {string}
 */
export function toText(value) {
  if (value === null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? String(Number(value.toPrecision(15)))
      : String(value);
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

/**
 * @param {FormulaValue} value
 * @param {string} what
 * @returns {number}
 */
function num(value, what) {
  if (typeof value === "number") return value;
  if (value === null) return 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  return fail(`${what} needs a number but got text`, "value");
}

/**
 * @param {number} x
 * @param {number} digits
 * @param {(value: number) => number} round
 */
function roundTo(x, digits, round) {
  if (!Number.isFinite(x)) return x;
  const d = Math.max(-15, Math.min(15, Math.trunc(digits)));
  const up = 10 ** Math.abs(d);
  const scaled = d >= 0 ? x * up : x / up;
  const snapped = Number(scaled.toPrecision(15));
  const rounded = round(snapped);
  return d >= 0 ? rounded / up : rounded * up;
}

/** Half away from zero, as a spreadsheet rounds. @param {number} v */
const roundHalfAway = (v) => Math.sign(v) * Math.round(Math.abs(v));

/**
 * @param {FormulaValue[]} values
 * @param {string} name
 */
function numbers(values, name) {
  return values.map((value) => num(value, name));
}

/** @type {FormulaFunction[]} */
export const defaultFunctions = [
  {
    name: "IF",
    params: [
      { name: "condition", description: "What to test." },
      { name: "then", description: "The result when the condition holds." },
      {
        name: "else",
        optional: true,
        description: "The result when it does not. Blank if left out.",
      },
    ],
    description:
      "Returns one value when a condition holds and another when it does not.",
    evaluateLazy: (args) =>
      toBoolean(args[0]()) ? args[1]() : args[2] ? args[2]() : null,
  },
  {
    name: "IFERROR",
    params: [
      { name: "value", description: "What to try." },
      { name: "fallback", description: "The result if the value is an error." },
    ],
    description:
      "Returns the value, or a fallback when it is an error such as a division by zero.",
    evaluateLazy: (args) => {
      try {
        return args[0]();
      } catch (error) {
        if (
          error instanceof FormulaError &&
          error.code !== "limit" &&
          error.code !== "timeout"
        ) {
          return args[1]();
        }
        throw error;
      }
    },
  },
  {
    name: "AND",
    params: [{ name: "values", type: "any", rest: true }],
    returns: "boolean",
    description:
      "True when every value is true. Stops at the first one that is not.",
    evaluateLazy: (args) => {
      for (const arg of args) if (!toBoolean(arg())) return false;
      return true;
    },
  },
  {
    name: "OR",
    params: [{ name: "values", type: "any", rest: true }],
    returns: "boolean",
    description: "True when any value is true. Stops at the first one that is.",
    evaluateLazy: (args) => {
      for (const arg of args) if (toBoolean(arg())) return true;
      return false;
    },
  },
  {
    name: "NOT",
    params: [{ name: "value" }],
    returns: "boolean",
    description: "Reverses a true or false value.",
    evaluate: ([value]) => !toBoolean(value),
  },
  {
    name: "COALESCE",
    params: [{ name: "values", rest: true }],
    description: "Returns the first value that is not blank.",
    evaluateLazy: (args) => {
      for (const arg of args) {
        const value = arg();
        if (value !== null && value !== "") return value;
      }
      return null;
    },
  },
  {
    name: "ISBLANK",
    params: [{ name: "value" }],
    returns: "boolean",
    description: "True when the value is blank.",
    evaluate: ([value]) => value === null || value === "",
  },
  {
    name: "BLANK",
    params: [],
    description: "A blank value.",
    evaluate: () => null,
  },
  {
    name: "ROUND",
    params: [
      { name: "number", type: "number", description: "The value to round." },
      {
        name: "digits",
        type: "number",
        optional: true,
        description:
          "Digits after the point. Negative rounds to tens, hundreds. Default 0.",
      },
    ],
    returns: "number",
    description: "Rounds a number, halves away from zero.",
    evaluate: ([value, digits]) =>
      roundTo(
        num(value, "ROUND"),
        digits === undefined ? 0 : num(digits, "ROUND"),
        roundHalfAway,
      ),
  },
  {
    name: "FLOOR",
    params: [{ name: "number", type: "number" }],
    returns: "number",
    description: "Rounds a number down to a whole number.",
    evaluate: ([value]) => Math.floor(num(value, "FLOOR")),
  },
  {
    name: "CEILING",
    params: [{ name: "number", type: "number" }],
    returns: "number",
    description: "Rounds a number up to a whole number.",
    evaluate: ([value]) => Math.ceil(num(value, "CEILING")),
  },
  {
    name: "ABS",
    params: [{ name: "number", type: "number" }],
    returns: "number",
    description: "The size of a number, without its sign.",
    evaluate: ([value]) => Math.abs(num(value, "ABS")),
  },
  {
    name: "SQRT",
    params: [{ name: "number", type: "number" }],
    returns: "number",
    description: "The square root of a number.",
    evaluate: ([value]) => {
      const x = num(value, "SQRT");
      return x < 0
        ? fail("SQRT needs a number of zero or more", "num")
        : Math.sqrt(x);
    },
  },
  {
    name: "POWER",
    params: [
      { name: "base", type: "number" },
      { name: "exponent", type: "number" },
    ],
    returns: "number",
    description: "A number raised to a power.",
    evaluate: ([base, exponent]) =>
      num(base, "POWER") ** num(exponent, "POWER"),
  },
  {
    name: "MOD",
    params: [
      { name: "number", type: "number" },
      { name: "divisor", type: "number" },
    ],
    returns: "number",
    description: "The remainder after dividing, with the sign of the divisor.",
    evaluate: ([value, divisor]) => {
      const d = num(divisor, "MOD");
      if (d === 0) return fail("Division by zero", "div0");
      const n = num(value, "MOD");
      return n - d * Math.floor(n / d);
    },
  },
  {
    name: "MIN",
    params: [{ name: "numbers", type: "number", rest: true }],
    returns: "number",
    description: "The smallest of the numbers.",
    evaluate: (args, context) => {
      context.charge(args.length);
      return numbers(args, "MIN").reduce((a, b) => Math.min(a, b));
    },
  },
  {
    name: "MAX",
    params: [{ name: "numbers", type: "number", rest: true }],
    returns: "number",
    description: "The largest of the numbers.",
    evaluate: (args, context) => {
      context.charge(args.length);
      return numbers(args, "MAX").reduce((a, b) => Math.max(a, b));
    },
  },
  {
    name: "SUM",
    params: [{ name: "numbers", type: "number", rest: true }],
    returns: "number",
    description: "The total of the numbers.",
    evaluate: (args, context) => {
      context.charge(args.length);
      return numbers(args, "SUM").reduce((total, n) => total + n, 0);
    },
  },
  {
    name: "AVERAGE",
    params: [{ name: "numbers", type: "number", rest: true }],
    returns: "number",
    description: "The mean of the numbers.",
    evaluate: (args, context) => {
      context.charge(args.length);
      return (
        numbers(args, "AVERAGE").reduce((total, n) => total + n, 0) /
        args.length
      );
    },
  },
  {
    name: "PI",
    params: [],
    returns: "number",
    description: "The number pi.",
    evaluate: () => Math.PI,
  },
  {
    name: "LEN",
    params: [{ name: "text", type: "string" }],
    returns: "number",
    description: "The number of characters in the text.",
    evaluate: ([value]) => toText(value).length,
  },
  {
    name: "UPPER",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    description: "The text in capitals.",
    evaluate: ([value]) => toText(value).toUpperCase(),
  },
  {
    name: "LOWER",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    description: "The text in lower case.",
    evaluate: ([value]) => toText(value).toLowerCase(),
  },
  {
    name: "TRIM",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    description: "The text without spaces at either end.",
    evaluate: ([value]) => toText(value).trim(),
  },
  {
    name: "LEFT",
    params: [
      { name: "text", type: "string" },
      {
        name: "count",
        type: "number",
        optional: true,
        description: "How many characters. Default 1.",
      },
    ],
    returns: "string",
    description: "The first characters of the text.",
    evaluate: ([value, count]) =>
      toText(value).slice(
        0,
        Math.max(0, count === undefined ? 1 : Math.trunc(num(count, "LEFT"))),
      ),
  },
  {
    name: "RIGHT",
    params: [
      { name: "text", type: "string" },
      {
        name: "count",
        type: "number",
        optional: true,
        description: "How many characters. Default 1.",
      },
    ],
    returns: "string",
    description: "The last characters of the text.",
    evaluate: ([value, count]) => {
      const text = toText(value);
      const n = Math.max(
        0,
        count === undefined ? 1 : Math.trunc(num(count, "RIGHT")),
      );
      return n === 0 ? "" : text.slice(-n);
    },
  },
  {
    name: "MID",
    params: [
      { name: "text", type: "string" },
      {
        name: "start",
        type: "number",
        description: "The first character, counting from 1.",
      },
      { name: "count", type: "number" },
    ],
    returns: "string",
    description: "Characters from the middle of the text.",
    evaluate: ([value, start, count]) => {
      const from = Math.max(1, Math.trunc(num(start, "MID"))) - 1;
      return toText(value).slice(
        from,
        from + Math.max(0, Math.trunc(num(count, "MID"))),
      );
    },
  },
  {
    name: "CONCAT",
    params: [{ name: "values", rest: true }],
    returns: "string",
    description: "Joins values into one text.",
    evaluate: (args, context) => {
      context.charge(args.length);
      const text = args.map(toText).join("");
      if (text.length > context.maxStringLength)
        fail("The text is too long", "limit");
      return text;
    },
  },
  {
    name: "REPT",
    params: [
      { name: "text", type: "string" },
      { name: "count", type: "number" },
    ],
    returns: "string",
    description: "Repeats the text.",
    evaluate: ([value, count], context) => {
      const text = toText(value);
      const n = Math.max(0, Math.trunc(num(count, "REPT")));
      if (text.length * n > context.maxStringLength)
        fail("The text is too long", "limit");
      context.charge(text.length * n);
      return text.repeat(n);
    },
  },
  {
    name: "SUBSTITUTE",
    params: [
      { name: "text", type: "string" },
      { name: "find", type: "string" },
      { name: "replacement", type: "string" },
    ],
    returns: "string",
    description: "Replaces every `find` in the text with the replacement.",
    evaluate: ([value, find, replacement], context) => {
      const text = toText(value);
      const needle = toText(find);
      context.charge(text.length);
      if (needle === "") return text;
      const result = text.split(needle).join(toText(replacement));
      if (result.length > context.maxStringLength)
        fail("The text is too long", "limit");
      return result;
    },
  },
  {
    name: "CONTAINS",
    params: [
      { name: "text", type: "string" },
      { name: "search", type: "string" },
    ],
    returns: "boolean",
    description: "True when the text has the search text in it, ignoring case.",
    evaluate: ([value, search], context) => {
      const text = toText(value);
      context.charge(text.length);
      return text.toLowerCase().includes(toText(search).toLowerCase());
    },
  },
  {
    name: "TEXT",
    params: [{ name: "value" }],
    returns: "string",
    description: "Turns a value into text.",
    evaluate: ([value]) => toText(value),
  },
  {
    name: "VALUE",
    params: [{ name: "text", type: "string" }],
    returns: "number",
    description: 'Turns text such as "12.5" into a number.',
    evaluate: ([value]) => {
      if (typeof value === "number") return value;
      const text = toText(value).trim();
      const n = text === "" ? Number.NaN : Number(text);
      return Number.isNaN(n)
        ? fail(`"${text.slice(0, 20)}" is not a number`, "value")
        : n;
    },
  },
];
