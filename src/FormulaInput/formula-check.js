// @ts-check

import {
  arity,
  createFunctionMap,
  defaultFunctions,
  paramIndexAt,
} from "./formula-functions.js";
import { MAX_DIAGNOSTICS, parseFormula } from "./formula-lang.js";

/**
 * @typedef {import("./formula-functions.js").FormulaFunction} FormulaFunction
 * @typedef {import("./formula-functions.js").FormulaType} FormulaType
 * @typedef {import("./formula-lang.js").FormulaNode} FormulaNode
 * @typedef {import("./formula-lang.js").FormulaDiagnostic} FormulaDiagnostic
 * @typedef {import("./formula-lang.js").FormulaParseResult} FormulaParseResult
 */

/**
 * @typedef {object} FormulaField
 * @property {string} id - What `{id}` and a bare `id` in a formula mean.
 * @property {string} [label] - What people call the field. A formula may use it too.
 * @property {FormulaType} [type] - Default `"any"`, which no type check rejects.
 * @property {string} [description]
 */

/**
 * @typedef {object} FormulaEnv
 * @property {Map<string, FormulaFunction>} functions - By upper-cased name.
 * @property {ReadonlyArray<FormulaField> | null} fields - `null` when the fields are not known: any name passes.
 * @property {Map<string, FormulaField>} byName - By id, then by label.
 * @property {Map<string, FormulaField>} byLowerName - The same, lower-cased.
 */

/**
 * Index the functions and fields once, for the checker, the evaluator and the
 * suggestions.
 * @param {ReadonlyArray<FormulaFunction>} [functions] - Default: the built-in set.
 * @param {ReadonlyArray<FormulaField> | null} [fields] - Leave out to accept any name.
 * @returns {FormulaEnv}
 */
export function createFormulaEnv(functions = defaultFunctions, fields = null) {
  /** @type {Map<string, FormulaField>} */
  const byName = new Map();
  /** @type {Map<string, FormulaField>} */
  const byLowerName = new Map();

  if (fields) {
    for (const field of fields) {
      if (!byName.has(field.id)) byName.set(field.id, field);
      if (!byLowerName.has(field.id.toLowerCase())) {
        byLowerName.set(field.id.toLowerCase(), field);
      }
    }
    for (const field of fields) {
      const label = field.label;
      if (!label) continue;
      if (!byName.has(label)) byName.set(label, field);
      if (!byLowerName.has(label.toLowerCase())) {
        byLowerName.set(label.toLowerCase(), field);
      }
    }
  }

  return {
    functions: createFunctionMap(functions),
    fields,
    byName,
    byLowerName,
  };
}

/**
 * Find the field a name stands for: the id, then the label, then either with
 * case ignored.
 * @param {FormulaEnv} env
 * @param {string} name
 * @returns {FormulaField | undefined}
 */
export function resolveField(env, name) {
  return env.byName.get(name) ?? env.byLowerName.get(name.toLowerCase());
}

/** @param {FormulaType} type */
function typeName(type) {
  return type === "string"
    ? "text"
    : type === "boolean"
      ? "true or false"
      : type;
}

/** @param {FormulaType} type */
function needs(type) {
  return type === "string" || type === "any"
    ? typeName(type)
    : type === "number"
      ? "a number"
      : "true or false";
}

/**
 * The edit distance of two short strings, with a swap of neighbours counted
 * once, or more than `limit` when it is.
 * @param {string} a
 * @param {string} b
 * @param {number} limit
 */
function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  /** @type {number[]} */
  let older = [];
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(
        row[j] + 1,
        next[j - 1] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        next[j] = Math.min(next[j], older[j - 2] + 1);
      }
    }
    older = row;
    row = next;
  }
  return row[b.length];
}

/**
 * The candidate closest to `name`, when one is close enough to be a typo.
 * @param {string} name
 * @param {Iterable<string>} candidates
 * @returns {string | undefined}
 */
export function closestName(name, candidates) {
  if (name.length === 0 || name.length > 40) return undefined;
  const lower = name.toLowerCase();
  const limit = Math.max(1, Math.floor(name.length / 3));
  let best;
  let bestDistance = limit + 1;
  let count = 0;
  for (const candidate of candidates) {
    if (++count > 500) break;
    if (candidate.length > 40) continue;
    const d = distance(lower, candidate.toLowerCase(), limit);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return best;
}

/** @param {FormulaNode} node @returns {FormulaNode[]} */
function childrenOf(node) {
  switch (node.type) {
    case "group":
      return [node.expr];
    case "unary":
      return [node.arg];
    case "binary":
      return [node.left, node.right];
    case "call":
      return node.args;
    default:
      return [];
  }
}

/**
 * Visit every node, children first, without recursion: a formula of a
 * hundred thousand terms makes a tree as deep as it is long.
 * @param {FormulaNode} root
 * @param {(node: FormulaNode) => void} visit
 */
export function walkFormula(root, visit) {
  /** @type {{ node: FormulaNode, kids: FormulaNode[], next: number }[]} */
  const stack = [{ node: root, kids: childrenOf(root), next: 0 }];
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    if (top.next < top.kids.length) {
      const kid = top.kids[top.next++];
      stack.push({ node: kid, kids: childrenOf(kid), next: 0 });
    } else {
      stack.pop();
      visit(top.node);
    }
  }
}

const ARITHMETIC = new Set(["-", "*", "/", "%", "^"]);
const COMPARISON = new Set(["=", "<>", "<", "<=", ">", ">="]);

/**
 * Check a tree against the functions and fields: unknown names, argument
 * counts and types.
 * @param {FormulaNode} ast
 * @param {FormulaEnv} env
 * @returns {{ diagnostics: FormulaDiagnostic[], type: FormulaType }}
 */
export function checkFormula(ast, env) {
  /** @type {FormulaDiagnostic[]} */
  const diagnostics = [];
  /** @type {Map<FormulaNode, FormulaType>} */
  const types = new Map();

  /** @type {string[] | undefined} */
  let fieldNames;
  /** @type {string[] | undefined} */
  let functionNames;

  /** @type {(node: FormulaNode) => FormulaType} */
  const typeOf = (node) => types.get(node) ?? "any";

  /**
   * @param {string} code
   * @param {string} message
   * @param {number} start
   * @param {number} end
   */
  function report(code, message, start, end) {
    if (diagnostics.length < MAX_DIAGNOSTICS) {
      diagnostics.push({ code, message, start, end: Math.max(end, start) });
    }
  }

  /**
   * @param {FormulaNode} node
   * @param {FormulaType} expected
   * @param {string} message
   */
  function expect(node, expected, message) {
    const actual = typeOf(node);
    if (
      node.type !== "error" &&
      expected !== "any" &&
      actual !== "any" &&
      actual !== expected
    ) {
      report(
        "type-mismatch",
        message.replace("{type}", typeName(actual)),
        node.start,
        node.end,
      );
    }
  }

  walkFormula(ast, (node) => {
    /** @type {FormulaType} */
    let type = "any";

    switch (node.type) {
      case "number":
        type = "number";
        break;
      case "string":
        type = "string";
        break;
      case "boolean":
        type = "boolean";
        break;
      case "field":
      case "name": {
        if (!env.fields) break;
        const field = resolveField(env, node.name);
        if (field) {
          type = field.type ?? "any";
          break;
        }
        if (diagnostics.length >= MAX_DIAGNOSTICS) break;
        fieldNames ??= env.fields.flatMap((f) =>
          f.label ? [f.id, f.label] : [f.id],
        );
        const guess = closestName(node.name, fieldNames);
        report(
          "unknown-field",
          `Unknown field "${node.name}"${guess ? `. Did you mean "${guess}"?` : ""}`,
          node.start,
          node.end,
        );
        break;
      }
      case "group":
        type = typeOf(node.expr);
        break;
      case "unary":
        if (node.op === "not") {
          type = "boolean";
        } else {
          expect(
            node.arg,
            "number",
            `"${node.op}" needs a number but got {type}`,
          );
          type = "number";
        }
        break;
      case "binary": {
        const { op, left, right } = node;
        if (ARITHMETIC.has(op) || op === "+") {
          const hint =
            op === "+" &&
            (typeOf(left) === "string" || typeOf(right) === "string")
              ? ". Use & to join text"
              : "";
          expect(
            left,
            "number",
            `"${op}" needs a number but got {type}${hint}`,
          );
          expect(
            right,
            "number",
            `"${op}" needs a number but got {type}${hint}`,
          );
          type = "number";
        } else if (op === "&") {
          type = "string";
        } else if (COMPARISON.has(op)) {
          const l = typeOf(left);
          const r = typeOf(right);
          if (
            left.type !== "error" &&
            right.type !== "error" &&
            l !== "any" &&
            r !== "any" &&
            l !== r
          ) {
            report(
              "type-mismatch",
              `Cannot compare ${typeName(l)} with ${typeName(r)}`,
              node.opStart,
              node.opEnd,
            );
          }
          type = "boolean";
        } else {
          type = "boolean";
        }
        break;
      }
      case "call": {
        const fn = env.functions.get(node.name.toUpperCase());
        if (!fn) {
          if (diagnostics.length >= MAX_DIAGNOSTICS) break;
          functionNames ??= [...env.functions.values()].map((f) => f.name);
          const guess = closestName(node.name, functionNames);
          report(
            "unknown-function",
            `Unknown function "${node.name}"${guess ? `. Did you mean ${guess.toUpperCase()}?` : ""}`,
            node.nameStart,
            node.nameEnd,
          );
          break;
        }
        type = fn.returns ?? "any";
        checkCall(node, fn);
        break;
      }
      default:
        break;
    }

    types.set(node, type);
  });

  /**
   * @param {import("./formula-lang.js").FormulaCallNode} node
   * @param {FormulaFunction} fn
   */
  function checkCall(node, fn) {
    const { min, max } = arity(fn);
    const name = fn.name.toUpperCase();
    const count = node.args.length;
    const noun = (/** @type {number} */ n) =>
      `${n} argument${n === 1 ? "" : "s"}`;
    const wanted =
      max === Number.POSITIVE_INFINITY
        ? `at least ${noun(min)}`
        : min === max
          ? noun(min)
          : `${min} to ${noun(max)}`;

    if (count < min && node.close > -1) {
      report(
        "arg-count",
        `${name} expects ${wanted}, got ${count}`,
        node.close - 1,
        node.close,
      );
    } else if (count > max) {
      report(
        "arg-count",
        `${name} expects ${wanted}, got ${count}`,
        node.args[max].start,
        node.args[count - 1].end,
      );
    }

    node.args.forEach((arg, i) => {
      const at = paramIndexAt(fn, i);
      if (at < 0) return;
      const param = fn.params[at];
      expect(
        arg,
        param.type ?? "any",
        `${name}: "${param.name}" needs ${needs(param.type ?? "any")} but got {type}`,
      );
    });
  }

  return { diagnostics, type: typeOf(ast) };
}

/**
 * @typedef {object} FormulaAnalysis
 * @property {FormulaNode | null} ast
 * @property {import("./formula-lang.js").FormulaToken[]} tokens
 * @property {FormulaDiagnostic[]} diagnostics - Syntax and semantic errors together, in source order.
 * @property {FormulaType} type - The type the formula yields, `"any"` when unknown.
 */

/**
 * Parse and check a formula: everything but the evaluation.
 * @param {string} source
 * @param {{ env?: FormulaEnv, functions?: ReadonlyArray<FormulaFunction>, fields?: ReadonlyArray<FormulaField> | null, maxDepth?: number }} [options]
 * @returns {FormulaAnalysis}
 */
export function analyzeFormula(source, options = {}) {
  const env =
    options.env ?? createFormulaEnv(options.functions, options.fields);
  const parsed = parseFormula(source, { maxDepth: options.maxDepth });
  const checked = parsed.ast
    ? checkFormula(parsed.ast, env)
    : { diagnostics: [], type: /** @type {FormulaType} */ ("any") };

  const diagnostics = [...parsed.diagnostics, ...checked.diagnostics]
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .slice(0, MAX_DIAGNOSTICS);

  return {
    ast: parsed.ast,
    tokens: parsed.tokens,
    diagnostics,
    type: checked.type,
  };
}
