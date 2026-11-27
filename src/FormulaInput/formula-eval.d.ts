import type { FormulaEnv, FormulaField } from "./formula-check.js";
import type { FormulaFunction, FormulaValue } from "./formula-functions.js";
import type { FormulaNode } from "./formula-lang.js";

export const DEFAULT_MAX_STEPS: number;
export const DEFAULT_MAX_TIME: number;
export const DEFAULT_MAX_STRING_LENGTH: number;

export type FormulaEvalOptions = {
  /** The values by field id. Only own properties are read. */
  row?: Record<string, unknown>;
  /** A prepared environment. Wins over `functions` and `fields`. */
  env?: FormulaEnv;
  /** Default: the built-in set. */
  functions?: ReadonlyArray<FormulaFunction>;
  fields?: ReadonlyArray<FormulaField> | null;
  /** Nodes and units of work. Default `10000`. */
  maxSteps?: number;
  /** Milliseconds. Default `20`. */
  maxTime?: number;
  /** The longest text a formula may build. Default `100000`. */
  maxStringLength?: number;
  /** Deepest nesting the parser accepts. */
  maxDepth?: number;
};

export type FormulaEvalError = {
  /** `"syntax"`, `"name"`, `"value"`, `"div0"`, `"num"`, `"arg-count"`, `"limit"`, `"timeout"` or `"error"`. */
  code: string;
  message: string;
  /** Where in the source, or `-1`. */
  start: number;
  end: number;
};

export type FormulaEvalResult =
  | { ok: true; value: FormulaValue; steps: number }
  | { ok: false; error: FormulaEvalError; steps: number };

/**
 * Evaluate a formula against a row. A safe evaluator: it walks the tree and
 * nothing else, and stops at a step or time limit.
 */
export function evaluateFormula(
  input: string | FormulaNode,
  options?: FormulaEvalOptions,
): FormulaEvalResult;

/** A value as a preview shows it: text in quotes, TRUE and FALSE, blank. */
export function formatResult(value: FormulaValue): string;
