// @ts-check

/**
 * The formula language: a tokenizer and a Pratt parser. Both are pure,
 * accept any string, and never throw. The parser reports every error it
 * finds, with a range, and keeps going.
 *
 * ```
 * formula  = expr?
 * expr     = operand ( binary operand )*
 * operand  = prefix* primary
 * primary  = number | string | "TRUE" | "FALSE" | field | name
 *          | name "(" ( expr ( "," expr )* )? ")" | "(" expr ")"
 * field    = "{" characters "}"          "\}" and "\\" escape
 * name     = letter ( letter | digit | "_" | "$" )* ( "." name )?
 * string   = '"' characters '"' | "'" characters "'"
 *            "\\" "\"" "\'" "\n" "\t" "\r" escape
 * number   = digits ( "." digits )? ( "e" sign? digits )? | "." digits
 * ```
 *
 * Operators, loosest first:
 *
 * | Level | Operators | Notes |
 * | --- | --- | --- |
 * | 1 | `\|\|` `or` | any value is true or false |
 * | 2 | `&&` `and` | |
 * | 3 | `not` `!` | prefix, takes a comparison |
 * | 4 | `=` `==` `<>` `!=` `<` `<=` `>` `>=` | left to right |
 * | 5 | `&` | joins text |
 * | 6 | `+` `-` | |
 * | 7 | `*` `/` `%` | |
 * | 8 | `-` `+` | prefix |
 * | 9 | `^` | right to left, binds tighter than a prefix `-`: `-2^2` is `-4` |
 *
 * Whitespace, including new lines, separates tokens and means nothing else.
 * @module
 */

/**
 * @typedef {"number" | "string" | "field" | "name" | "operator" | "lparen" | "rparen" | "comma" | "space" | "error"} FormulaTokenType
 */

/**
 * @typedef {object} FormulaToken
 * @property {FormulaTokenType} type
 * @property {number} start - Offset of the first code unit.
 * @property {number} end - Offset after the last code unit.
 * @property {string | number} [value] - The decoded value: the number, the text of a string, or the name of a field.
 * @property {string} [message] - Why an `error` token, or an unterminated string or field, is wrong.
 * @property {boolean} [closed] - `false` for a string or field that has no closing character.
 */

/**
 * @typedef {object} FormulaDiagnostic
 * @property {string} code - A stable code such as `"unclosed-paren"`.
 * @property {string} message
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {object} FormulaNodeBase
 * @property {number} start
 * @property {number} end
 */

/** @typedef {FormulaNodeBase & { type: "number", value: number }} FormulaNumberNode */
/** @typedef {FormulaNodeBase & { type: "string", value: string }} FormulaStringNode */
/** @typedef {FormulaNodeBase & { type: "boolean", value: boolean }} FormulaBooleanNode */
/** @typedef {FormulaNodeBase & { type: "field", name: string }} FormulaFieldNode */
/** @typedef {FormulaNodeBase & { type: "name", name: string }} FormulaNameNode */
/** @typedef {FormulaNodeBase & { type: "group", expr: FormulaNode }} FormulaGroupNode */
/** @typedef {FormulaNodeBase & { type: "unary", op: string, arg: FormulaNode, opEnd: number }} FormulaUnaryNode */
/** @typedef {FormulaNodeBase & { type: "binary", op: string, left: FormulaNode, right: FormulaNode, opStart: number, opEnd: number }} FormulaBinaryNode */
/** @typedef {FormulaNodeBase & { type: "call", name: string, nameStart: number, nameEnd: number, args: FormulaNode[], close: number }} FormulaCallNode */
/** @typedef {FormulaNodeBase & { type: "error" }} FormulaErrorNode */

/**
 * @typedef {FormulaNumberNode | FormulaStringNode | FormulaBooleanNode | FormulaFieldNode | FormulaNameNode | FormulaGroupNode | FormulaUnaryNode | FormulaBinaryNode | FormulaCallNode | FormulaErrorNode} FormulaNode
 */

/**
 * @typedef {object} FormulaParseResult
 * @property {FormulaNode | null} ast - `null` for an empty formula.
 * @property {FormulaToken[]} tokens - Every token, spaces included. Joined, their text is the source.
 * @property {FormulaDiagnostic[]} diagnostics - Syntax errors, in source order.
 */

/**
 * @typedef {object} FormulaParseOptions
 * @property {number} [maxDepth] - Deepest nesting of groups, calls and prefix operators. Default `128`.
 */

export const DEFAULT_MAX_DEPTH = 128;

/** Diagnostics kept per formula. A line of noise does not need ten thousand. */
export const MAX_DIAGNOSTICS = 100;

const NAME_START = "[\\p{L}_$]";
const NAME_PART = "[\\p{L}\\p{M}\\p{N}_$]";
const NAME =
  /[\p{L}_$][\p{L}\p{M}\p{N}_$]*(?:\.[\p{L}_$][\p{L}\p{M}\p{N}_$]*)*/uy;
const SPACE = /\s+/uy;
const NAME_START_CHAR = /^[\p{L}_$]/u;

/** Matches a whole string that can be written without braces. */
export const BARE_NAME = new RegExp(
  `^${NAME_START}${NAME_PART}*(?:\\.${NAME_START}${NAME_PART}*)*$`,
  "u",
);

const OPERATORS_2 = new Set(["<>", "<=", ">=", "!=", "==", "&&", "||"]);
const OPERATORS_1 = new Set("+-*/%^&<>=!|");
const WORD_OPERATORS = new Set(["and", "or", "not"]);

/**
 * Escape a field name for use in braces.
 * @param {string} name
 * @returns {string}
 */
export function escapeFieldName(name) {
  return name.replace(/[\\}]/g, "\\$&");
}

/**
 * Whether a name can stand without braces: it is a plain name and no word
 * the language gives a meaning to.
 * @param {string} name
 * @returns {boolean}
 */
export function isBareName(name) {
  if (!BARE_NAME.test(name)) return false;
  const lower = name.toLowerCase();
  return lower !== "true" && lower !== "false" && !WORD_OPERATORS.has(lower);
}

/** @type {Record<string, string>} */
const ESCAPES = { n: "\n", t: "\t", r: "\r" };

/**
 * Split `source` into tokens. Never throws; a character the language does
 * not use becomes an `error` token. A string stops at a new line, so one
 * missing quote does not swallow the lines after it.
 * @param {string} source
 * @returns {FormulaToken[]}
 */
export function tokenize(source) {
  /** @type {FormulaToken[]} */
  const tokens = [];
  const length = source.length;
  let i = 0;

  while (i < length) {
    const start = i;
    const code = source.charCodeAt(i);
    const char = source[i];

    // Space: the common ASCII ones first, then anything `\s` knows.
    if (code === 32 || code === 10 || code === 9 || code === 13) {
      i++;
      while (i < length) {
        const c = source.charCodeAt(i);
        if (c === 32 || c === 10 || c === 9 || c === 13) i++;
        else break;
      }
      tokens.push({ type: "space", start, end: i });
      continue;
    }

    if (
      (code >= 48 && code <= 57) ||
      (char === "." && isDigit(source, i + 1))
    ) {
      i = scanNumber(source, i);
      tokens.push({
        type: "number",
        start,
        end: i,
        value: Number(source.slice(start, i)),
      });
      continue;
    }

    if (char === '"' || char === "'") {
      const token = scanString(source, i, char);
      tokens.push(token);
      i = token.end;
      continue;
    }

    if (char === "{") {
      const token = scanField(source, i);
      tokens.push(token);
      i = token.end;
      continue;
    }

    if (char === "(") {
      i++;
      tokens.push({ type: "lparen", start, end: i });
      continue;
    }
    if (char === ")") {
      i++;
      tokens.push({ type: "rparen", start, end: i });
      continue;
    }
    if (char === ",") {
      i++;
      tokens.push({ type: "comma", start, end: i });
      continue;
    }

    if (OPERATORS_1.has(char)) {
      const pair = source.slice(i, i + 2);
      i += OPERATORS_2.has(pair) ? 2 : 1;
      tokens.push({
        type: "operator",
        start,
        end: i,
        value: source.slice(start, i),
      });
      continue;
    }

    NAME.lastIndex = i;
    const name = NAME.exec(source);
    if (name) {
      i += name[0].length;
      tokens.push({ type: "name", start, end: i, value: name[0] });
      continue;
    }

    SPACE.lastIndex = i;
    const space = SPACE.exec(source);
    if (space) {
      i += space[0].length;
      tokens.push({ type: "space", start, end: i });
      continue;
    }

    // One code point, so a surrogate pair is not cut in two.
    i += (source.codePointAt(i) ?? 0) > 0xffff ? 2 : 1;
    tokens.push({
      type: "error",
      start,
      end: i,
      message: `Unexpected character "${source.slice(start, i)}"`,
    });
  }

  return tokens;
}

/**
 * @param {string} source
 * @param {number} index
 */
function isDigit(source, index) {
  const code = source.charCodeAt(index);
  return code >= 48 && code <= 57;
}

/**
 * @param {string} source
 * @param {number} from
 * @returns {number} the offset after the number
 */
function scanNumber(source, from) {
  let i = from;
  while (isDigit(source, i)) i++;
  if (source[i] === "." && isDigit(source, i + 1)) {
    i++;
    while (isDigit(source, i)) i++;
  } else if (source[i] === "." && i > from && !isNameStart(source, i + 1)) {
    // "5." is a number. "5.name" is not one.
    i++;
  }
  const mark = source[i];
  if (mark === "e" || mark === "E") {
    let j = i + 1;
    if (source[j] === "+" || source[j] === "-") j++;
    if (isDigit(source, j)) {
      while (isDigit(source, j)) j++;
      i = j;
    }
  }
  return i;
}

/**
 * @param {string} source
 * @param {number} index
 */
function isNameStart(source, index) {
  const char = source[index];
  return char !== undefined && NAME_START_CHAR.test(char);
}

/**
 * @param {string} source
 * @param {number} from - Offset of the opening quote.
 * @param {string} quote
 * @returns {FormulaToken}
 */
function scanString(source, from, quote) {
  const length = source.length;
  let i = from + 1;
  let value = "";
  let chunk = i;

  while (i < length) {
    const char = source[i];
    if (char === quote) {
      value += source.slice(chunk, i);
      return { type: "string", start: from, end: i + 1, value, closed: true };
    }
    if (char === "\n") break;
    if (char === "\\" && i + 1 < length && source[i + 1] !== "\n") {
      value += source.slice(chunk, i);
      const next = source[i + 1];
      value += ESCAPES[next] ?? next;
      i += 2;
      chunk = i;
      continue;
    }
    i++;
  }

  value += source.slice(chunk, i);
  return {
    type: "string",
    start: from,
    end: i,
    value,
    closed: false,
    message: "Missing closing quote",
  };
}

/**
 * @param {string} source
 * @param {number} from - Offset of the opening brace.
 * @returns {FormulaToken}
 */
function scanField(source, from) {
  const length = source.length;
  let i = from + 1;
  let name = "";
  let chunk = i;

  while (i < length) {
    const char = source[i];
    if (char === "}") {
      name += source.slice(chunk, i);
      return {
        type: "field",
        start: from,
        end: i + 1,
        value: name.trim(),
        closed: true,
      };
    }
    if (char === "\n") break;
    if (char === "\\" && i + 1 < length && source[i + 1] !== "\n") {
      name += source.slice(chunk, i) + source[i + 1];
      i += 2;
      chunk = i;
      continue;
    }
    i++;
  }

  name += source.slice(chunk, i);
  return {
    type: "field",
    start: from,
    end: i,
    value: name.trim(),
    closed: false,
    message: "Missing closing }",
  };
}

/**
 * @typedef {object} OperatorInfo
 * @property {number} left - Binding power as an infix operator.
 * @property {number} right - Binding power of the right operand.
 * @property {string} op - Canonical operator.
 */

/** @type {Map<string, OperatorInfo>} */
const INFIX = new Map(
  /** @type {[string, number, number, string][]} */ ([
    ["||", 10, 11, "||"],
    ["&&", 20, 21, "&&"],
    ["=", 40, 41, "="],
    ["==", 40, 41, "="],
    ["<>", 40, 41, "<>"],
    ["!=", 40, 41, "<>"],
    ["<", 40, 41, "<"],
    ["<=", 40, 41, "<="],
    [">", 40, 41, ">"],
    [">=", 40, 41, ">="],
    ["&", 50, 51, "&"],
    ["+", 60, 61, "+"],
    ["-", 60, 61, "-"],
    ["*", 70, 71, "*"],
    ["/", 70, 71, "/"],
    ["%", 70, 71, "%"],
    ["^", 90, 90, "^"],
  ]).map(([key, left, right, op]) => [key, { left, right, op }]),
);

const NOT_POWER = 30;
const PREFIX_POWER = 80;

/**
 * The operator a token stands for in infix position, if it is one.
 * @param {FormulaToken | undefined} token
 * @param {string} source
 * @returns {OperatorInfo | null}
 */
function infixOf(token, source) {
  if (!token) return null;
  if (token.type === "operator") {
    return INFIX.get(/** @type {string} */ (token.value)) ?? null;
  }
  if (token.type === "name") {
    const word = source.slice(token.start, token.end).toLowerCase();
    if (word === "and") return INFIX.get("&&") ?? null;
    if (word === "or") return INFIX.get("||") ?? null;
  }
  return null;
}

/**
 * Parse `source`. Never throws, whatever the text, and always returns: every
 * loop consumes a token or ends, and nesting stops at `maxDepth`.
 * @param {string} source
 * @param {FormulaParseOptions} [options]
 * @returns {FormulaParseResult}
 */
export function parseFormula(source, options = {}) {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const tokens = tokenize(source);
  const sig = tokens.filter((token) => token.type !== "space");
  /** @type {FormulaDiagnostic[]} */
  const diagnostics = [];
  let pos = 0;
  let depth = 0;
  let aborted = false;

  /**
   * @param {string} code
   * @param {string} message
   * @param {number} start
   * @param {number} end
   */
  function report(code, message, start, end) {
    if (aborted || diagnostics.length >= MAX_DIAGNOSTICS) return;
    diagnostics.push({ code, message, start, end: Math.max(end, start) });
  }

  const peek = () => sig[pos];
  const prev = () => sig[pos - 1];

  /** @param {number} at */
  function errorNode(at) {
    return /** @type {FormulaNode} */ ({ type: "error", start: at, end: at });
  }

  /** Stop parsing: the formula nests too deeply to go on. */
  function abort() {
    const token = peek() ?? prev();
    report(
      "too-deep",
      "This formula is nested too deeply",
      token ? token.start : 0,
      token ? token.end : 0,
    );
    aborted = true;
    pos = sig.length;
  }

  /**
   * @param {number} minPower
   * @returns {FormulaNode}
   */
  function parseExpr(minPower) {
    if (++depth > maxDepth) {
      if (!aborted) abort();
      depth--;
      return errorNode(source.length);
    }
    let left = parsePrefix();

    if (left.type === "error" && left.start === left.end) {
      const next = peek();
      const before = prev();
      if (
        next &&
        infixOf(next, source) &&
        (!before || before.type === "lparen" || before.type === "comma")
      ) {
        report(
          "expected-operand",
          `Expected a value before "${source.slice(next.start, next.end)}"`,
          next.start,
          next.end,
        );
      }
    }

    while (!aborted) {
      const token = peek();
      const info = infixOf(token, source);
      if (!token || !info || info.left < minPower) break;
      pos++;
      const right = parseExpr(info.right);
      if (right.type === "error" && right.start === right.end) {
        report(
          "expected-operand",
          `Expected a value after "${source.slice(token.start, token.end)}"`,
          token.start,
          token.end,
        );
      }
      left = {
        type: "binary",
        op: info.op,
        left,
        right,
        start: left.start,
        end: right.end > right.start ? right.end : token.end,
        opStart: token.start,
        opEnd: token.end,
      };
    }

    depth--;
    return left;
  }

  /** @returns {FormulaNode} */
  function parsePrefix() {
    const token = peek();
    if (!token) return errorNode(source.length);

    if (token.type === "operator") {
      const op = /** @type {string} */ (token.value);
      if (op === "-" || op === "+" || op === "!") {
        pos++;
        const arg = parseExpr(op === "!" ? NOT_POWER : PREFIX_POWER);
        if (arg.type === "error" && arg.start === arg.end) {
          report(
            "expected-operand",
            `Expected a value after "${op}"`,
            token.start,
            token.end,
          );
        }
        return {
          type: "unary",
          op: op === "!" ? "not" : op,
          arg,
          start: token.start,
          end: arg.end > arg.start ? arg.end : token.end,
          opEnd: token.end,
        };
      }
    }

    if (token.type === "name") {
      const word = source.slice(token.start, token.end);
      const lower = word.toLowerCase();
      const next = sig[pos + 1];
      if (lower === "not" && next?.type !== "lparen") {
        pos++;
        const arg = parseExpr(NOT_POWER);
        if (arg.type === "error" && arg.start === arg.end) {
          report(
            "expected-operand",
            `Expected a value after "${word}"`,
            token.start,
            token.end,
          );
        }
        return {
          type: "unary",
          op: "not",
          arg,
          start: token.start,
          end: arg.end > arg.start ? arg.end : token.end,
          opEnd: token.end,
        };
      }
      return parseName(token, lower);
    }

    return parsePrimary(token);
  }

  /**
   * @param {FormulaToken} token
   * @returns {FormulaNode}
   */
  function parsePrimary(token) {
    switch (token.type) {
      case "number": {
        pos++;
        const value = /** @type {number} */ (token.value);
        if (!Number.isFinite(value)) {
          report(
            "number-range",
            "This number is too large",
            token.start,
            token.end,
          );
        }
        return { type: "number", value, start: token.start, end: token.end };
      }
      case "string": {
        pos++;
        if (token.closed === false) {
          report(
            "unterminated-string",
            token.message ?? "Missing closing quote",
            token.start,
            token.end,
          );
        }
        return {
          type: "string",
          value: /** @type {string} */ (token.value),
          start: token.start,
          end: token.end,
        };
      }
      case "field": {
        pos++;
        if (token.closed === false) {
          report(
            "unterminated-field",
            token.message ?? "Missing closing }",
            token.start,
            token.end,
          );
        } else if (token.value === "") {
          report(
            "empty-field",
            "This field reference is empty",
            token.start,
            token.end,
          );
        }
        return {
          type: "field",
          name: /** @type {string} */ (token.value),
          start: token.start,
          end: token.end,
        };
      }
      case "lparen":
        return parseGroup(token);
      case "error": {
        pos++;
        report(
          "unexpected-character",
          token.message ?? "Unexpected character",
          token.start,
          token.end,
        );
        return { type: "error", start: token.start, end: token.end };
      }
      case "rparen": {
        // The caller decides: a stray ")" is reported where it is consumed.
        return errorNode(token.start);
      }
      default: {
        return errorNode(token.start);
      }
    }
  }

  /**
   * @param {FormulaToken} token
   * @returns {FormulaNode}
   */
  function parseGroup(token) {
    pos++;
    const expr = parseExpr(0);
    if (expr.type === "error" && expr.start === expr.end) {
      const after = peek();
      if (after?.type === "rparen") {
        report(
          "empty-group",
          "Expected a value between the parentheses",
          token.start,
          after.end,
        );
      } else {
        report(
          "expected-operand",
          "Expected a value after (",
          token.start,
          token.end,
        );
      }
    }
    skipTo(["rparen"]);
    const close = peek();
    if (close?.type === "rparen") {
      pos++;
      return { type: "group", expr, start: token.start, end: close.end };
    }
    report("unclosed-paren", "Missing closing )", token.start, token.end);
    return {
      type: "group",
      expr,
      start: token.start,
      end: expr.end || token.end,
    };
  }

  /**
   * Skip tokens, with a message for the first, until one of `types` at this
   * level of parentheses or the end. Each skipped token is consumed.
   * @param {FormulaTokenType[]} types
   */
  function skipTo(types) {
    const token = peek();
    if (!token || types.includes(token.type)) return;
    if (token.type === "error") {
      report(
        "unexpected-character",
        token.message ?? "Unexpected character",
        token.start,
        token.end,
      );
    } else {
      report(
        "unexpected-token",
        `Expected an operator, ${types.includes("comma") ? '"," ' : ""}or ")" but found "${source.slice(token.start, token.end)}"`,
        token.start,
        token.end,
      );
    }
    let nested = 0;
    while (pos < sig.length) {
      const current = sig[pos];
      if (nested === 0 && types.includes(current.type)) return;
      if (current.type === "lparen") nested++;
      else if (current.type === "rparen") {
        if (nested === 0) return;
        nested--;
      }
      pos++;
    }
  }

  /**
   * A name: a call when "(" follows, a constant, or a bare field.
   * @param {FormulaToken} token
   * @param {string} lower
   * @returns {FormulaNode}
   */
  function parseName(token, lower) {
    pos++;
    const name = /** @type {string} */ (token.value);
    const next = peek();
    if (next?.type === "lparen") return parseCall(token, name, next);
    if (lower === "true" || lower === "false") {
      return {
        type: "boolean",
        value: lower === "true",
        start: token.start,
        end: token.end,
      };
    }
    return { type: "name", name, start: token.start, end: token.end };
  }

  /**
   * @param {FormulaToken} nameToken
   * @param {string} name
   * @param {FormulaToken} open
   * @returns {FormulaNode}
   */
  function parseCall(nameToken, name, open) {
    pos++;
    /** @type {FormulaNode[]} */
    const args = [];
    let close = -1;

    if (peek()?.type === "rparen") {
      close = /** @type {FormulaToken} */ (peek()).end;
      pos++;
    } else {
      while (!aborted) {
        const arg = parseExpr(0);
        if (arg.type === "error" && arg.start === arg.end) {
          const at = peek();
          if (at?.type === "comma" || at?.type === "rparen") {
            const previous = prev() ?? open;
            report(
              "missing-argument",
              "Expected a value",
              previous.start,
              previous.end,
            );
          }
        }
        args.push(arg);
        skipTo(["comma", "rparen"]);
        const token = peek();
        if (token?.type === "comma") {
          pos++;
          if (peek() === undefined) {
            report(
              "missing-argument",
              "Expected a value after the comma",
              token.start,
              token.end,
            );
          }
          continue;
        }
        if (token?.type === "rparen") {
          close = token.end;
          pos++;
        } else {
          report("unclosed-paren", "Missing closing )", open.start, open.end);
        }
        break;
      }
    }

    const last = args[args.length - 1];
    return {
      type: "call",
      name,
      nameStart: nameToken.start,
      nameEnd: nameToken.end,
      args,
      close,
      start: nameToken.start,
      end: close > -1 ? close : Math.max(last?.end ?? 0, open.end),
    };
  }

  /** @type {FormulaNode | null} */
  let ast = null;

  if (sig.length > 0) {
    ast = parseExpr(0);

    // Whatever is left: each stray token is named once, then parsing goes on
    // so errors after it are reported too.
    while (!aborted && pos < sig.length) {
      const token = sig[pos];
      const before = pos;
      if (token.type === "rparen") {
        report("unmatched-paren", 'Unmatched ")"', token.start, token.end);
        pos++;
      } else if (token.type === "comma") {
        report("unexpected-token", 'Unexpected ","', token.start, token.end);
        pos++;
      } else {
        if (token.type !== "error") {
          report(
            "unexpected-token",
            `Expected an operator but found "${source.slice(token.start, token.end)}"`,
            token.start,
            token.end,
          );
        }
        parseExpr(0);
      }
      if (pos === before) pos++;
    }
  }

  diagnostics.sort((a, b) => a.start - b.start || a.end - b.end);
  return { ast, tokens, diagnostics };
}
