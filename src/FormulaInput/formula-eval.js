// @ts-check

import {
  analyzeFormula,
  createFormulaEnv,
  resolveField,
} from "./formula-check.js";
import { arity, FormulaError, toBoolean, toText } from "./formula-functions.js";

/**
 * A safe evaluator. It walks the tree and nothing else: no `eval`, no
 * `Function`, no `import`, no property access beyond a row's own fields.
 * Every node costs a step and the clock is checked as steps pass, so hostile
 * text cannot hang the page: `REPT("a", 1e9)` stops at the text limit, and a
 * formula of a million terms stops at the step limit.
 *
 * What it cannot stop: a function a consumer registers runs as written. The
 * limits are checked between steps, not inside it. Do not register one that
 * loops on its arguments.
 * @module
 */

/**
 * @typedef {import("./formula-functions.js").FormulaValue} FormulaValue
 * @typedef {import("./formula-functions.js").FormulaFunction} FormulaFunction
 * @typedef {import("./formula-check.js").FormulaField} FormulaField
 * @typedef {import("./formula-check.js").FormulaEnv} FormulaEnv
 * @typedef {import("./formula-lang.js").FormulaNode} FormulaNode
 */

export const DEFAULT_MAX_STEPS = 10000;
export const DEFAULT_MAX_TIME = 20;
export const DEFAULT_MAX_STRING_LENGTH = 100000;
const MAX_EVAL_DEPTH = 400;

/**
 * @typedef {object} FormulaEvalOptions
 * @property {Record<string, unknown>} [row] - The values by field id. Only own properties are read.
 * @property {FormulaEnv} [env] - A prepared environment. Wins over `functions` and `fields`.
 * @property {ReadonlyArray<FormulaFunction>} [functions] - Default: the built-in set.
 * @property {ReadonlyArray<FormulaField> | null} [fields]
 * @property {number} [maxSteps] - Nodes and units of work. Default `10000`.
 * @property {number} [maxTime] - Milliseconds. Default `20`.
 * @property {number} [maxStringLength] - The longest text a formula may build. Default `100000`.
 * @property {number} [maxDepth] - Deepest nesting the parser accepts.
 */

/**
 * @typedef {object} FormulaEvalError
 * @property {string} code - `"syntax"`, `"name"`, `"value"`, `"div0"`, `"num"`, `"arg-count"`, `"limit"`, `"timeout"` or `"error"`.
 * @property {string} message
 * @property {number} start - Where in the source, or `-1`.
 * @property {number} end
 */

/**
 * @typedef {{ ok: true, value: FormulaValue, steps: number } | { ok: false, error: FormulaEvalError, steps: number }} FormulaEvalResult
 */

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Evaluate a formula against a row.
 * @param {string | FormulaNode} input - The formula, or a tree that parsed with no errors.
 * @param {FormulaEvalOptions} [options]
 * @returns {FormulaEvalResult}
 */
export function evaluateFormula(input, options = {}) {
  const env =
    options.env ?? createFormulaEnv(options.functions, options.fields);
  let ast;

  if (typeof input === "string") {
    const analysis = analyzeFormula(input, { env, maxDepth: options.maxDepth });
    if (analysis.diagnostics.length > 0) {
      const first = analysis.diagnostics[0];
      return {
        ok: false,
        steps: 0,
        error: {
          code: "syntax",
          message: first.message,
          start: first.start,
          end: first.end,
        },
      };
    }
    ast = analysis.ast;
    if (!ast) return { ok: true, value: null, steps: 0 };
  } else {
    ast = input;
  }

  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxTime = options.maxTime ?? DEFAULT_MAX_TIME;
  const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  const row = options.row ?? {};
  const now =
    typeof performance === "object" && performance
      ? () => performance.now()
      : () => Date.now();
  const deadline = now() + maxTime;
  let steps = 0;
  let checked = 0;

  /** @param {number} units */
  function charge(units) {
    steps += units;
    if (steps > maxSteps) {
      throw new FormulaError(
        "This formula is too expensive to evaluate",
        "limit",
      );
    }
    if (steps - checked >= 64) {
      checked = steps;
      if (now() > deadline) {
        throw new FormulaError("This formula took too long", "timeout");
      }
    }
  }

  /** @type {import("./formula-functions.js").FormulaCallContext} */
  const context = {
    fail: (message, code = "value") => {
      throw new FormulaError(message, code);
    },
    charge,
    maxStringLength,
  };

  /**
   * @param {FormulaNode} node
   * @param {string} message
   * @param {string} code
   * @returns {never}
   */
  function failAt(node, message, code) {
    throw new FormulaError(message, code, node.start, node.end);
  }

  /**
   * @param {unknown} raw
   * @param {FormulaNode} node
   * @returns {FormulaValue}
   */
  function normalize(raw, node) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "number") return Number.isNaN(raw) ? null : raw;
    if (typeof raw === "string" || typeof raw === "boolean") return raw;
    if (typeof raw === "bigint") return Number(raw);
    return failAt(node, "A field holds a value a formula cannot use", "value");
  }

  /**
   * @param {FormulaNode} node
   * @param {string} name
   */
  function lookup(node, name) {
    const field = resolveField(env, name);
    if (field) {
      return normalize(hasOwn.call(row, field.id) ? row[field.id] : null, node);
    }
    if (env.fields) return failAt(node, `Unknown field "${name}"`, "name");
    return normalize(hasOwn.call(row, name) ? row[name] : null, node);
  }

  /**
   * @param {FormulaValue} value
   * @param {FormulaNode} node
   * @param {string} op
   * @returns {number}
   */
  function number(value, node, op) {
    if (typeof value === "number") return value;
    if (value === null) return 0;
    if (typeof value === "boolean") return value ? 1 : 0;
    return failAt(node, `"${op}" needs a number but got text`, "value");
  }

  /**
   * @param {FormulaNode} node
   * @param {number} result
   */
  function finite(node, result) {
    // Snap to 15 digits, so 0.1 + 0.2 = 0.3 as it does in a spreadsheet.
    return Number.isFinite(result)
      ? Number(result.toPrecision(15))
      : failAt(node, "The result is not a finite number", "num");
  }

  /**
   * Blank equals the empty value of whatever it is compared with.
   * @param {FormulaValue} a
   * @param {FormulaValue} b
   * @returns {[FormulaValue, FormulaValue]}
   */
  function pair(a, b) {
    /** @param {FormulaValue} v */
    const empty = (v) =>
      typeof v === "number" ? 0 : typeof v === "string" ? "" : false;
    if (a === null && b !== null) return [empty(b), b];
    if (b === null && a !== null) return [a, empty(a)];
    return [a, b];
  }

  /**
   * @param {FormulaValue} a
   * @param {FormulaValue} b
   */
  function equal(a, b) {
    const [x, y] = pair(a, b);
    if (typeof x === "string" && typeof y === "string") {
      return x.toLowerCase() === y.toLowerCase();
    }
    return x === y;
  }

  /**
   * @param {import("./formula-lang.js").FormulaBinaryNode} node
   * @param {FormulaValue} left
   * @param {() => FormulaValue} right
   * @returns {FormulaValue}
   */
  function binary(node, left, right) {
    const { op } = node;
    if (op === "&&") return toBoolean(left) ? toBoolean(right()) : false;
    if (op === "||") return toBoolean(left) ? true : toBoolean(right());

    const r = right();
    switch (op) {
      case "+":
        return finite(
          node,
          number(left, node.left, op) + number(r, node.right, op),
        );
      case "-":
        return finite(
          node,
          number(left, node.left, op) - number(r, node.right, op),
        );
      case "*":
        return finite(
          node,
          number(left, node.left, op) * number(r, node.right, op),
        );
      case "/":
      case "%": {
        const divisor = number(r, node.right, op);
        if (divisor === 0) return failAt(node, "Division by zero", "div0");
        const dividend = number(left, node.left, op);
        return finite(
          node,
          op === "/" ? dividend / divisor : dividend % divisor,
        );
      }
      case "^":
        return finite(
          node,
          number(left, node.left, op) ** number(r, node.right, op),
        );
      case "&": {
        const text = toText(left) + toText(r);
        if (text.length > maxStringLength) {
          return failAt(node, "The text is too long", "limit");
        }
        charge(Math.ceil(text.length / 256));
        return text;
      }
      case "=":
        return equal(left, r);
      case "<>":
        return !equal(left, r);
      default: {
        const [x, y] = pair(left, r);
        const same =
          (typeof x === "number" && typeof y === "number") ||
          (typeof x === "string" && typeof y === "string") ||
          (typeof x === "boolean" && typeof y === "boolean");
        if (!same) {
          return failAt(
            node,
            "Cannot compare values of different types",
            "value",
          );
        }
        const a = typeof x === "string" ? x.toLowerCase() : x;
        const b = typeof y === "string" ? y.toLowerCase() : y;
        if (op === "<") return a < b;
        if (op === "<=") return a <= b;
        if (op === ">") return a > b;
        return a >= b;
      }
    }
  }

  /**
   * @param {import("./formula-lang.js").FormulaCallNode} node
   * @param {number} depth
   * @returns {FormulaValue}
   */
  function call(node, depth) {
    const fn = env.functions.get(node.name.toUpperCase());
    if (!fn) return failAt(node, `Unknown function "${node.name}"`, "name");
    if (!fn.evaluate && !fn.evaluateLazy) {
      return failAt(
        node,
        `${fn.name.toUpperCase()} cannot be calculated here`,
        "unsupported",
      );
    }
    const { min, max } = arity(fn);
    if (node.args.length < min || node.args.length > max) {
      return failAt(
        node,
        `${fn.name.toUpperCase()} got the wrong number of arguments`,
        "arg-count",
      );
    }

    try {
      const result = fn.evaluateLazy
        ? fn.evaluateLazy(
            node.args.map((arg) => () => run(arg, depth + 1)),
            context,
          )
        : /** @type {NonNullable<typeof fn.evaluate>} */ (fn.evaluate)(
            node.args.map((arg) => run(arg, depth + 1)),
            context,
          );
      return normalize(result, node);
    } catch (error) {
      if (error instanceof FormulaError) {
        if (error.start < 0) {
          error.start = node.start;
          error.end = node.end;
        }
        throw error;
      }
      if (error instanceof RangeError) {
        return failAt(node, "This formula is too deep to evaluate", "limit");
      }
      return failAt(node, `${fn.name.toUpperCase()} failed`, "error");
    }
  }

  /**
   * @param {FormulaNode} node
   * @param {number} depth
   * @returns {FormulaValue}
   */
  function run(node, depth) {
    charge(1);
    if (depth > MAX_EVAL_DEPTH) {
      return failAt(node, "This formula is nested too deeply", "limit");
    }

    switch (node.type) {
      case "number":
      case "string":
      case "boolean":
        return node.value;
      case "field":
      case "name":
        return lookup(node, node.name);
      case "group":
        return run(node.expr, depth + 1);
      case "unary": {
        const value = run(node.arg, depth + 1);
        if (node.op === "not") return !toBoolean(value);
        const n = number(value, node.arg, node.op);
        return node.op === "-" ? -n : n;
      }
      case "binary": {
        // A chain such as 1 + 2 + 3 + ... leans left. Walk it in a loop so its
        // length does not cost stack.
        /** @type {import("./formula-lang.js").FormulaBinaryNode[]} */
        const spine = [];
        /** @type {FormulaNode} */
        let current = node;
        while (current.type === "binary") {
          spine.push(current);
          current = current.left;
        }
        let acc = run(current, depth + 1);
        for (let i = spine.length - 1; i >= 0; i--) {
          const step = spine[i];
          if (i > 0) charge(1);
          acc = binary(step, acc, () => run(step.right, depth + 1));
        }
        return acc;
      }
      case "call":
        return call(node, depth);
      default:
        return failAt(node, "This part of the formula has an error", "syntax");
    }
  }

  try {
    return { ok: true, value: run(ast, 0), steps };
  } catch (error) {
    if (error instanceof FormulaError) {
      return {
        ok: false,
        steps,
        error: {
          code: error.code,
          message: error.message,
          start: error.start,
          end: error.end,
        },
      };
    }
    return {
      ok: false,
      steps,
      error: {
        code: error instanceof RangeError ? "limit" : "error",
        message: "This formula could not be calculated",
        start: -1,
        end: -1,
      },
    };
  }
}

/**
 * A value as a preview shows it: text in quotes, TRUE and FALSE, blank.
 * @param {FormulaValue} value
 * @returns {string}
 */
export function formatResult(value) {
  if (value === null) return "(blank)";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return toText(value);
}
