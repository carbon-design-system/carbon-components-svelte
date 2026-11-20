// @ts-check
// The query language of `TokenSearch`, as pure functions: a tokenizer, a
// parser that checks the tokens against a schema, and a formatter. Nothing
// here throws. Text that does not parse becomes free text or a qualifier
// with an entry in `errors`, so a half-typed query still highlights.
//
//   query     = term*
//   term      = "-"? ( qualifier | phrase | word )
//   qualifier = key ":" value ( "," value )*
//   value     = quoted | bare            a bare value is one of
//                                          ">" bare   ">=" bare   "<" bare   "<=" bare
//                                          bare ".." bare   bare ".."   ".." bare
//   phrase    = quoted
//   key       = [A-Za-z_][A-Za-z0-9_.-]*
//
// Terms are separated by whitespace, outside quotes. Inside quotes, `\"` and
// `\\` are escapes. A comparison or a range is only read from a bare value:
// quoting a value makes it a literal. There is no `OR` keyword and no
// grouping: a comma is "any of", repeated keys are "and".

/**
 * @typedef {"enum" | "text" | "date" | "number" | "user"} TokenKeyType
 */

/**
 * An allowed value of an `enum` or `user` key.
 * @typedef {Object} TokenValue
 * @property {string} value What is written after the colon.
 * @property {string} [label] What the menu shows. Defaults to `value`.
 * @property {string} [description] Muted text beside the label. The query also matches it.
 */

/**
 * @typedef {Object} TokenKey
 * @property {string} key What is written before the colon. Letters, digits, `_`, `.` and `-`.
 * @property {string} [label] What the menu shows. Defaults to `key`.
 * @property {string} [description] Muted text beside the label.
 * @property {TokenKeyType} [type="text"]
 * @property {ReadonlyArray<string | TokenValue>} [values] The values to offer. For an `enum` they are also the only valid ones.
 * @property {(query: string, context: { signal: AbortSignal, key: string }) => ReadonlyArray<string | TokenValue> | Promise<ReadonlyArray<string | TokenValue>>} [source] Values for the typed text, synchronously or as a promise.
 */

/**
 * @typedef {"eq" | "gt" | "gte" | "lt" | "lte" | "between"} TokenOperator
 */

/**
 * @typedef {Object} TokenFilter
 * @property {string} key The schema's spelling of the key, or the typed one when it is not in the schema.
 * @property {TokenOperator} op
 * @property {string[]} values One for a comparison, two for a range (an open end is `""`), any number for `eq`. Dates are ISO `YYYY-MM-DD`; an enum is the schema's `value`.
 * @property {boolean} negated
 * @property {number} [start] Index of the first character.
 * @property {number} [end] Index after the last character.
 */

/**
 * @typedef {Object} TokenTerm
 * @property {string} text
 * @property {boolean} phrase Written in quotes.
 * @property {boolean} negated
 * @property {number} [start]
 * @property {number} [end]
 */

/**
 * @typedef {"unknown-key" | "missing-value" | "invalid-value" | "invalid-operator" | "unterminated-quote"} TokenErrorCode
 */

/**
 * @typedef {Object} TokenError
 * @property {TokenErrorCode} code
 * @property {string} message
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {Object} TokenQuery
 * @property {string} text The free text: its terms, without the negated ones, joined by a space and without quotes.
 * @property {TokenTerm[]} terms
 * @property {TokenFilter[]} filters
 * @property {TokenError[]} errors
 */

/**
 * @typedef {Object} ParseOptions
 * @property {ReadonlyArray<TokenKey>} [keys] The schema. Without it every key is accepted as text.
 * @property {Date} [now] What `@today` is relative to.
 */

/**
 * One piece of a qualifier's value, with its place in the text.
 * @typedef {Object} ValuePiece
 * @property {string} text Unescaped, without quotes.
 * @property {number} start Index of the first character, a quote included.
 * @property {number} end Index after the last character, a quote included.
 * @property {boolean} quoted
 * @property {boolean} closed False for a quote that never ends.
 */

/**
 * @typedef {Object} Token
 * @property {"text" | "qualifier"} type
 * @property {number} start
 * @property {number} end
 * @property {boolean} negated
 * @property {number} bodyStart Index after the `-`.
 * @property {string} [text] A text token's text, unescaped.
 * @property {boolean} [phrase]
 * @property {boolean} [closed] False for a phrase whose quote never ends.
 * @property {string} [key] A qualifier's key as typed.
 * @property {number} [keyEnd] Index of the colon.
 * @property {ValuePiece[]} [pieces]
 */

const KEY_START = /[A-Za-z_]/;
const KEY_CHAR = /[A-Za-z0-9_.-]/;
const SPACE = /\s/;
const COMPARATOR = /^(>=|<=|>|<)/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const RELATIVE_DATE =
  /^@(today|yesterday|tomorrow)(?:([+-])(\d{1,4})([dwmy]))?$/i;
const NUMBER = /^[+-]?\d+(?:\.\d+)?$/;

/**
 * Read a quoted string that starts at `from` (the opening quote).
 * @param {string} input
 * @param {number} from
 * @returns {{ text: string, end: number, closed: boolean }}
 */
function readQuoted(input, from) {
  let text = "";
  let i = from + 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && (input[i + 1] === '"' || input[i + 1] === "\\")) {
      text += input[i + 1];
      i += 2;
    } else if (ch === '"') {
      return { text, end: i + 1, closed: true };
    } else {
      text += ch;
      i++;
    }
  }
  return { text, end: i, closed: false };
}

/**
 * Split text into tokens. Total: any string gives a list, and the tokens
 * cover every non-space character exactly once.
 * @param {string} input
 * @returns {Token[]}
 */
export function tokenize(input) {
  /** @type {Token[]} */
  const tokens = [];
  const n = input.length;
  let i = 0;

  while (i < n) {
    if (SPACE.test(input[i])) {
      i++;
      continue;
    }
    const start = i;
    let negated = false;
    if (input[i] === "-" && i + 1 < n && !SPACE.test(input[i + 1])) {
      negated = true;
      i++;
    }
    const bodyStart = i;

    if (input[i] === '"') {
      const quoted = readQuoted(input, i);
      tokens.push({
        type: "text",
        start,
        end: quoted.end,
        negated,
        bodyStart,
        text: quoted.text,
        phrase: true,
        closed: quoted.closed,
      });
      i = quoted.end;
      continue;
    }

    // A key is letters, digits and `_.-`, then a colon. `http://x` is a
    // URL, so a colon followed by two slashes leaves the word as text.
    let k = i;
    if (KEY_START.test(input[k] ?? "")) {
      while (k < n && KEY_CHAR.test(input[k])) k++;
    }
    if (k > i && input[k] === ":" && input.slice(k + 1, k + 3) !== "//") {
      const keyEnd = k;
      i = k + 1;
      /** @type {ValuePiece[]} */
      const pieces = [];
      for (;;) {
        const pieceStart = i;
        if (input[i] === '"') {
          const quoted = readQuoted(input, i);
          let text = quoted.text;
          i = quoted.end;
          // `"a"b`: what follows a closing quote joins the value.
          while (
            quoted.closed &&
            i < n &&
            !SPACE.test(input[i]) &&
            input[i] !== ","
          ) {
            text += input[i];
            i++;
          }
          pieces.push({
            text,
            start: pieceStart,
            end: i,
            quoted: true,
            closed: quoted.closed,
          });
        } else {
          while (i < n && !SPACE.test(input[i]) && input[i] !== ",") i++;
          pieces.push({
            text: input.slice(pieceStart, i),
            start: pieceStart,
            end: i,
            quoted: false,
            closed: true,
          });
        }
        if (input[i] === ",") {
          i++;
          continue;
        }
        break;
      }
      tokens.push({
        type: "qualifier",
        start,
        end: i,
        negated,
        bodyStart,
        key: input.slice(bodyStart, keyEnd),
        keyEnd,
        pieces,
      });
      continue;
    }

    while (i < n && !SPACE.test(input[i])) i++;
    tokens.push({
      type: "text",
      start,
      end: i,
      negated,
      bodyStart,
      text: input.slice(bodyStart, i),
      phrase: false,
      closed: true,
    });
  }
  return tokens;
}

/**
 * @param {number} y
 * @param {number} m 1 to 12
 * @param {number} d
 */
function isRealDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** @param {number} n @param {number} width */
const pad = (n, width) => String(n).padStart(width, "0");

/**
 * `YYYY-MM-DD` for a day in the local calendar.
 * @param {Date} date
 */
export function toIsoDate(date) {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/**
 * Resolve a date as written to `YYYY-MM-DD`: an ISO date, `@today`,
 * `@yesterday` or `@tomorrow`, with an offset such as `@today-7d`,
 * `@today+2w`, `@today-1m` or `@today-1y`. `null` when it is none of them.
 * @param {string} text
 * @param {Date} [now]
 * @returns {string | null}
 */
export function resolveDate(text, now = new Date()) {
  const iso = ISO_DATE.exec(text);
  if (iso) {
    return isRealDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
      ? text
      : null;
  }
  const rel = RELATIVE_DATE.exec(text);
  if (!rel) return null;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const base = rel[1].toLowerCase();
  if (base === "yesterday") date.setDate(date.getDate() - 1);
  if (base === "tomorrow") date.setDate(date.getDate() + 1);
  if (rel[3]) {
    const amount = Number(rel[3]) * (rel[2] === "-" ? -1 : 1);
    const unit = rel[4].toLowerCase();
    if (unit === "d") date.setDate(date.getDate() + amount);
    else if (unit === "w") date.setDate(date.getDate() + amount * 7);
    else if (unit === "m") date.setMonth(date.getMonth() + amount);
    else date.setFullYear(date.getFullYear() + amount);
  }
  return toIsoDate(date);
}

/**
 * The schema's entry for a key typed in any case.
 * @param {ReadonlyArray<TokenKey> | undefined} keys
 * @param {string} key
 * @returns {TokenKey | undefined}
 */
export function findKey(keys, key) {
  if (!keys) return undefined;
  const folded = key.toLowerCase();
  return keys.find((def) => def.key.toLowerCase() === folded);
}

/**
 * @param {string | TokenValue} entry
 * @returns {TokenValue}
 */
export function toTokenValue(entry) {
  return typeof entry === "string" ? { value: entry } : entry;
}

/**
 * Check one value against its key's type. Returns the normalized value, or
 * `null` when it is not valid.
 * @param {string} value
 * @param {TokenKey | undefined} def
 * @param {Date} now
 * @returns {string | null}
 */
function normalizeValue(value, def, now) {
  switch (def?.type) {
    case "date":
      return resolveDate(value, now);
    case "number":
      return NUMBER.test(value) ? value : null;
    case "enum": {
      const folded = value.toLowerCase();
      for (const entry of def.values ?? []) {
        const item = toTokenValue(entry);
        if (
          item.value.toLowerCase() === folded ||
          (item.label ?? "").toLowerCase() === folded
        ) {
          return item.value;
        }
      }
      return null;
    }
    default:
      return value === "" ? null : value;
  }
}

/** @type {Record<string, TokenOperator>} */
const COMPARATOR_OPS = { ">": "gt", ">=": "gte", "<": "lt", "<=": "lte" };

/**
 * Split one bare value into its operator and operands.
 * @param {string} text
 * @returns {{ op: TokenOperator, operands: string[] }}
 */
function splitOperator(text) {
  const cmp = COMPARATOR.exec(text);
  if (cmp) {
    return {
      op: COMPARATOR_OPS[cmp[1]],
      operands: [text.slice(cmp[1].length)],
    };
  }
  const dots = text.indexOf("..");
  return {
    op: "between",
    operands: [text.slice(0, dots), text.slice(dots + 2)],
  };
}

/**
 * Parse a query. Never throws.
 * @param {string} input
 * @param {ParseOptions} [options]
 * @returns {TokenQuery}
 */
export function parseQuery(input, options = {}) {
  const { keys, now = new Date() } = options;
  /** @type {TokenTerm[]} */
  const terms = [];
  /** @type {TokenFilter[]} */
  const filters = [];
  /** @type {TokenError[]} */
  const errors = [];

  for (const token of tokenize(String(input ?? ""))) {
    if (token.type === "text") {
      const text = token.text ?? "";
      if (token.phrase && !token.closed) {
        errors.push({
          code: "unterminated-quote",
          message: "The quote is never closed",
          start: token.start,
          end: token.end,
        });
      }
      terms.push({
        text,
        phrase: !!token.phrase,
        negated: token.negated,
        start: token.start,
        end: token.end,
      });
      continue;
    }

    const typed = token.key ?? "";
    const def = findKey(keys, typed);
    const pieces = token.pieces ?? [];
    const filledPieces = pieces.filter((piece) => piece.text !== "");
    /** @type {TokenFilter} */
    const filter = {
      key: def?.key ?? typed,
      op: "eq",
      values: [],
      negated: token.negated,
      start: token.start,
      end: token.end,
    };

    if (keys && !def) {
      errors.push({
        code: "unknown-key",
        message: `Unknown key "${typed}"`,
        start: token.start,
        end: token.keyEnd ?? token.end,
      });
    }

    for (const piece of pieces) {
      if (!piece.closed) {
        errors.push({
          code: "unterminated-quote",
          message: "The quote is never closed",
          start: piece.start,
          end: piece.end,
        });
      }
    }

    if (filledPieces.length === 0) {
      errors.push({
        code: "missing-value",
        message: `"${typed}" needs a value`,
        start: token.start,
        end: token.end,
      });
      filters.push(filter);
      continue;
    }

    // A comparison or a range is read from one bare value, and only for a
    // number, a date, or a key the schema does not know. A text, enum or
    // user key takes `..` as part of the value but flags a comparison.
    const first = filledPieces[0];
    const takesOperators = !def || def.type === "number" || def.type === "date";
    const single = filledPieces.length === 1 && !first.quoted;
    const comparison = single && COMPARATOR.test(first.text);

    if (single && takesOperators && (comparison || first.text.includes(".."))) {
      const parsed = splitOperator(first.text);
      filter.op = parsed.op;
      filter.values = parsed.operands.map((operand) => {
        if (operand === "") return "";
        const value = def ? normalizeValue(operand, def, now) : operand;
        if (value === null) {
          errors.push({
            code: "invalid-value",
            message: `"${operand}" is not a valid ${def?.type ?? "value"} for "${typed}"`,
            start: first.start,
            end: first.end,
          });
          return operand;
        }
        return value;
      });
      const open = filter.values.filter((value) => value === "").length;
      if (open === (parsed.op === "between" ? 2 : 1)) {
        errors.push({
          code: "missing-value",
          message: `"${typed}" needs a value`,
          start: first.start,
          end: first.end,
        });
      }
      filters.push(filter);
      continue;
    }

    if (comparison && !takesOperators) {
      errors.push({
        code: "invalid-operator",
        message: `"${typed}" does not take a comparison`,
        start: first.start,
        end: first.end,
      });
    }

    filter.values = filledPieces.map((piece) => {
      // Without a schema entry every value is text.
      const value = def ? normalizeValue(piece.text, def, now) : piece.text;
      if (value === null) {
        errors.push({
          code: "invalid-value",
          message: `"${piece.text}" is not a valid ${def?.type ?? "value"} for "${typed}"`,
          start: piece.start,
          end: piece.end,
        });
        return piece.text;
      }
      return value;
    });
    filters.push(filter);
  }

  return {
    text: terms
      .filter((term) => !term.negated)
      .map((term) => term.text)
      .join(" "),
    terms,
    filters,
    errors,
  };
}

/** Characters that need the quotes of a value. */
const NEEDS_QUOTES = /[\s,"\\]/;
const OPERATOR_START = /^[<>]/;
const TERM_START = /^["-]/;
const QUALIFIER_START = /^[A-Za-z_][A-Za-z0-9_.-]*:(?!\/\/)/;
const ESCAPED = /[\\"]/g;

/**
 * Write one value of a qualifier. Quotes it when it holds a space, a comma
 * or a quote, is empty, or would read as a comparison or a range.
 * @param {string} value
 * @returns {string}
 */
export function formatValue(value) {
  if (
    value === "" ||
    NEEDS_QUOTES.test(value) ||
    OPERATOR_START.test(value) ||
    value.includes("..")
  ) {
    return `"${value.replace(ESCAPED, "\\$&")}"`;
  }
  return value;
}

/**
 * Write a free-text term. A word that would read as a qualifier, start with
 * a minus sign or hold a space is quoted.
 * @param {string} text
 * @param {boolean} [phrase]
 * @returns {string}
 */
export function formatTerm(text, phrase = false) {
  if (
    phrase ||
    text === "" ||
    SPACE.test(text) ||
    TERM_START.test(text) ||
    QUALIFIER_START.test(text)
  ) {
    return `"${text.replace(ESCAPED, "\\$&")}"`;
  }
  return text;
}

/** @type {Record<string, string>} */
const OP_PREFIX = { gt: ">", gte: ">=", lt: "<", lte: "<=" };

/**
 * Write one filter, such as `-label:bug,"good first issue"` or
 * `created:2026-01-01..2026-02-01`.
 * @param {TokenFilter} filter
 * @returns {string}
 */
export function formatFilter(filter) {
  const sign = filter.negated ? "-" : "";
  let body;
  if (filter.op === "between") {
    body = `${filter.values[0] ?? ""}..${filter.values[1] ?? ""}`;
  } else if (filter.op === "eq") {
    body = filter.values.map(formatValue).join(",");
  } else {
    body = `${OP_PREFIX[filter.op]}${filter.values[0] ?? ""}`;
  }
  return `${sign}${filter.key}:${body}`;
}

/**
 * Write a query as text. Terms and filters keep the order they were parsed
 * in; those without a position (built by hand) go filters first. The
 * spacing is one space, so `format(parse(text))` is the canonical form of
 * `text` and `parse(format(query))` is `query`, positions aside.
 * @param {Pick<TokenQuery, "terms" | "filters">} query
 * @returns {string}
 */
export function formatQuery(query) {
  /** @type {Array<{ at: number, text: string }>} */
  const parts = [];
  for (const filter of query.filters) {
    parts.push({
      at: filter.start ?? Number.POSITIVE_INFINITY,
      text: formatFilter(filter),
    });
  }
  for (const term of query.terms) {
    parts.push({
      at: term.start ?? Number.POSITIVE_INFINITY,
      text: `${term.negated ? "-" : ""}${formatTerm(term.text, term.phrase)}`,
    });
  }
  // `sort` is stable, so equal positions keep filters before terms.
  return parts
    .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1))
    .map((part) => part.text)
    .join(" ");
}

/**
 * A query without its positions, to compare two parses.
 * @param {TokenQuery} query
 */
export function withoutPositions(query) {
  return {
    text: query.text,
    terms: query.terms.map(({ text, phrase, negated }) => ({
      text,
      phrase,
      negated,
    })),
    filters: query.filters.map(({ key, op, values, negated }) => ({
      key,
      op,
      values,
      negated,
    })),
    errors: query.errors.map(({ code }) => code),
  };
}
