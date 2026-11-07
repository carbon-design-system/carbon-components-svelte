import type { FormulaEnv } from "./formula-check.js";
import type { FormulaFunction, FormulaSignature } from "./formula-functions.js";
import type { FormulaDiagnostic, FormulaToken } from "./formula-lang.js";

export type CompletionContext = {
  /** `"field"` inside braces, where only fields fit. */
  kind: "expression" | "field";
  /** Where the replaced text starts. */
  start: number;
  /** Where it ends. */
  end: number;
  /** What is typed before the caret. */
  query: string;
  /** What `[start, end)` holds now. */
  text: string;
  /** A `}` follows, so a field needs no new one. */
  closed: boolean;
  /** The character after the replaced text. */
  following: string;
};

export type CompletionItem = {
  kind: "function" | "field";
  /** What the row shows: a function name or a field's label. */
  label: string;
  /** A field's id and type, or a function's signature. */
  detail: string;
  description: string;
  /** Replaces `[start, end)`. */
  insert: string;
  /** Where the caret goes, as an offset from `start`. */
  caret: number;
  /** Indices in `label` that match the query. */
  matched: number[];
};

export type SignatureHelp = {
  fn: FormulaFunction;
  signature: FormulaSignature;
  /** Which argument the caret is in, from 0. */
  argIndex: number;
  /** The parameter it fills, or `-1` when it is an extra one. */
  activeParam: number;
};

/**
 * What the caret is completing. `null` when nothing fits: inside a string or
 * a number, or where an operator belongs.
 */
export function completionContext(
  source: string,
  tokens: FormulaToken[],
  caret: number,
): CompletionContext | null;

/** The completions for a context, best first. */
export function getCompletions(
  context: CompletionContext,
  env: FormulaEnv,
  options?: { limit?: number; refBy?: "id" | "label" },
): CompletionItem[];

/** The call the caret is inside, and the argument it is in. */
export function signatureHelp(
  tokens: FormulaToken[],
  source: string,
  caret: number,
  env: FormulaEnv,
): SignatureHelp | null;

/** The next diagnostic after `from`, wrapping round; the one before it when `backwards`. */
export function nextDiagnostic(
  diagnostics: FormulaDiagnostic[],
  from: number,
  backwards?: boolean,
): FormulaDiagnostic | null;

/** Whether a typed `)` should step over the one after the caret. */
export function shouldTypeOver(
  source: string,
  caret: number,
  diagnostics: FormulaDiagnostic[],
): boolean;
