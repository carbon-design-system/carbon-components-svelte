// @ts-check

import { fuzzyMatch } from "../utils/fuzzy-match.js";
import { formatSignature, paramIndexAt } from "./formula-functions.js";
import { escapeFieldName, isBareName } from "./formula-lang.js";

/**
 * @typedef {import("./formula-lang.js").FormulaToken} FormulaToken
 * @typedef {import("./formula-lang.js").FormulaDiagnostic} FormulaDiagnostic
 * @typedef {import("./formula-functions.js").FormulaFunction} FormulaFunction
 * @typedef {import("./formula-check.js").FormulaEnv} FormulaEnv
 */

/**
 * @typedef {object} CompletionContext
 * @property {"expression" | "field"} kind - `"field"` inside braces, where only fields fit.
 * @property {number} start - Where the replaced text starts.
 * @property {number} end - Where it ends.
 * @property {string} query - What is typed before the caret.
 * @property {string} text - What `[start, end)` holds now.
 * @property {boolean} closed - A `}` follows, so a field needs no new one.
 * @property {string} following - The character after the replaced text.
 */

/**
 * @typedef {object} CompletionItem
 * @property {"function" | "field"} kind
 * @property {string} label - What the row shows: a function name or a field's label.
 * @property {string} detail - A field's id and type, or a function's signature.
 * @property {string} description
 * @property {string} insert - Replaces `[start, end)`.
 * @property {number} caret - Where the caret goes, as an offset from `start`.
 * @property {number[]} matched - Indices in `label` that match the query.
 */

const OPERAND_END = new Set(["number", "string", "field", "name", "rparen"]);
const WORD_OPERATORS = new Set(["and", "or", "not"]);

/**
 * Whether a value may start at the token before `index` (an operator, an
 * opening parenthesis, a comma or the start), looking back past spaces.
 * @param {FormulaToken[]} tokens
 * @param {number} index - Tokens before this one count.
 * @param {string} source
 */
function expectsValue(tokens, index, source) {
  for (let i = index - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.type === "space") continue;
    if (token.type === "name") {
      return WORD_OPERATORS.has(
        source.slice(token.start, token.end).toLowerCase(),
      );
    }
    return !OPERAND_END.has(token.type);
  }
  return true;
}

/**
 * What the caret is completing: a name or a field reference being typed, or a
 * place a value could start. `null` when nothing fits: inside a string or a
 * number, or where an operator belongs.
 * @param {string} source
 * @param {FormulaToken[]} tokens
 * @param {number} caret
 * @returns {CompletionContext | null}
 */
export function completionContext(source, tokens, caret) {
  let index = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.start < caret && caret <= token.end) {
      index = i;
      break;
    }
    if (token.start >= caret) break;
  }

  const token = tokens[index];
  if (token?.type === "field") {
    const inner = token.start + 1;
    if (token.closed === false) {
      return {
        kind: "field",
        start: inner,
        end: caret,
        query: source.slice(inner, caret),
        text: source.slice(inner, caret),
        closed: false,
        following: source[caret] ?? "",
      };
    }
    if (caret >= inner && caret < token.end) {
      return {
        kind: "field",
        start: inner,
        end: token.end - 1,
        query: source.slice(inner, caret),
        text: source.slice(inner, token.end - 1),
        closed: true,
        following: "}",
      };
    }
    return null;
  }

  if (token?.type === "name") {
    if (!expectsValue(tokens, index, source)) return null;
    return {
      kind: "expression",
      start: token.start,
      end: token.end,
      query: source.slice(token.start, caret),
      text: source.slice(token.start, token.end),
      closed: false,
      following: source[token.end] ?? "",
    };
  }

  if (
    token &&
    (token.type === "number" ||
      token.type === "string" ||
      token.type === "error")
  ) {
    return null;
  }

  // Between tokens: a space, an operator, a parenthesis or the very start.
  const before =
    index === -1 ? tokens.findIndex((t) => t.start >= caret) : index + 1;
  if (!expectsValue(tokens, before === -1 ? tokens.length : before, source)) {
    return null;
  }
  return {
    kind: "expression",
    start: caret,
    end: caret,
    query: "",
    text: "",
    closed: false,
    following: source[caret] ?? "",
  };
}

/**
 * What a field is called in a formula.
 * @param {import("./formula-check.js").FormulaField} field
 * @param {"id" | "label"} refBy
 */
function refName(field, refBy) {
  return refBy === "label" ? field.label || field.id : field.id;
}

/**
 * The completions for a context, best first.
 * @param {CompletionContext} context
 * @param {FormulaEnv} env
 * @param {{ limit?: number, refBy?: "id" | "label" }} [options]
 * @returns {CompletionItem[]}
 */
export function getCompletions(context, env, options = {}) {
  const limit = options.limit ?? 8;
  const refBy = options.refBy ?? "id";
  const { query } = context;
  /** @type {{ item: CompletionItem, score: number }[]} */
  const found = [];

  for (const field of env.fields ?? []) {
    const name = refName(field, refBy);
    const label = field.label || field.id;
    // The label is what is shown, so it is what is matched; the id counts too.
    const byLabel = fuzzyMatch(label, query, { threshold: 0.7 });
    const byId =
      label === field.id
        ? byLabel
        : fuzzyMatch(field.id, query, { threshold: 0.7 });
    if (!byLabel.matched && !byId.matched) continue;

    const braced = context.kind === "field";
    const insert = braced
      ? escapeFieldName(name) + (context.closed ? "" : "}")
      : isBareName(name)
        ? name
        : `{${escapeFieldName(name)}}`;
    found.push({
      score: Math.max(
        byLabel.matched ? byLabel.score : 0,
        byId.matched ? byId.score : 0,
      ),
      item: {
        kind: "field",
        label,
        detail: [
          field.id === label ? "" : field.id,
          field.type && field.type !== "any" ? field.type : "",
        ]
          .filter(Boolean)
          .join(" · "),
        description: field.description ?? "",
        insert,
        caret: insert.length + (braced && context.closed ? 1 : 0),
        matched: byLabel.matched ? byLabel.indices : [],
      },
    });
  }

  if (context.kind === "expression") {
    const hasParen = context.following === "(";
    for (const fn of env.functions.values()) {
      const name = fn.name.toUpperCase();
      const match = fuzzyMatch(name, query, { threshold: 0.7 });
      if (!match.matched) continue;
      const insert = hasParen ? name : `${name}()`;
      found.push({
        score: match.score,
        item: {
          kind: "function",
          label: name,
          detail: formatSignature(fn).text,
          description: fn.description ?? "",
          insert,
          caret: hasParen
            ? name.length
            : name.length + (fn.params.length > 0 ? 1 : 2),
          matched: match.indices,
        },
      });
    }
  }

  // Array#sort is stable: equal scores keep fields before functions.
  found.sort((a, b) => b.score - a.score);
  return found
    .filter((entry) => entry.item.insert !== context.text)
    .slice(0, limit)
    .map((entry) => entry.item);
}

/**
 * @typedef {object} SignatureHelp
 * @property {FormulaFunction} fn
 * @property {import("./formula-functions.js").FormulaSignature} signature
 * @property {number} argIndex - Which argument the caret is in, from 0.
 * @property {number} activeParam - The parameter it fills, or `-1` when it is an extra one.
 */

/**
 * The call the caret is inside, and the argument it is in. Works on text that
 * does not parse: it reads the tokens up to the caret.
 * @param {FormulaToken[]} tokens
 * @param {string} source
 * @param {number} caret
 * @param {FormulaEnv} env
 * @returns {SignatureHelp | null}
 */
export function signatureHelp(tokens, source, caret, env) {
  /** @type {{ name: string | null, argIndex: number }[]} */
  const stack = [];
  /** @type {FormulaToken | null} */
  let previous = null;

  for (const token of tokens) {
    if (token.end > caret) break;
    if (token.type === "space") continue;
    if (token.type === "lparen") {
      stack.push({
        name:
          previous?.type === "name"
            ? source.slice(previous.start, previous.end)
            : null,
        argIndex: 0,
      });
    } else if (token.type === "comma") {
      if (stack.length > 0) stack[stack.length - 1].argIndex++;
    } else if (token.type === "rparen") {
      stack.pop();
    }
    previous = token;
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    const entry = stack[i];
    if (entry.name === null) continue;
    const fn = env.functions.get(entry.name.toUpperCase());
    if (!fn) return null;
    return {
      fn,
      signature: formatSignature(fn),
      argIndex: entry.argIndex,
      activeParam: paramIndexAt(fn, entry.argIndex),
    };
  }
  return null;
}

/**
 * The next diagnostic after `from`, wrapping round; the one before it when
 * `backwards`.
 * @param {FormulaDiagnostic[]} diagnostics - In source order.
 * @param {number} from - A caret offset.
 * @param {boolean} [backwards]
 * @returns {FormulaDiagnostic | null}
 */
export function nextDiagnostic(diagnostics, from, backwards = false) {
  if (diagnostics.length === 0) return null;
  if (backwards) {
    for (let i = diagnostics.length - 1; i >= 0; i--) {
      if (diagnostics[i].start < from) return diagnostics[i];
    }
    return diagnostics[diagnostics.length - 1];
  }
  return diagnostics.find((d) => d.start > from) ?? diagnostics[0];
}

/**
 * Whether a typed `)` should step over the one after the caret, rather than
 * add another: it does when the text has no missing `)` to fill.
 * @param {string} source
 * @param {number} caret
 * @param {FormulaDiagnostic[]} diagnostics
 */
export function shouldTypeOver(source, caret, diagnostics) {
  return (
    source[caret] === ")" &&
    !diagnostics.some((d) => d.code === "unclosed-paren")
  );
}
