import type { FormulaFunction, FormulaType } from "./formula-functions.js";
import type {
  FormulaDiagnostic,
  FormulaNode,
  FormulaToken,
} from "./formula-lang.js";

export type FormulaField = {
  /** What `{id}` and a bare `id` in a formula mean. */
  id: string;
  /** What people call the field. A formula may use it too. */
  label?: string;
  /** Default `"any"`, which no type check rejects. */
  type?: FormulaType;
  description?: string;
};

export type FormulaEnv = {
  /** By upper-cased name. */
  functions: Map<string, FormulaFunction>;
  /** `null` when the fields are not known: any name passes. */
  fields: ReadonlyArray<FormulaField> | null;
  /** By id, then by label. */
  byName: Map<string, FormulaField>;
  /** The same, lower-cased. */
  byLowerName: Map<string, FormulaField>;
};

export type FormulaAnalysis = {
  ast: FormulaNode | null;
  tokens: FormulaToken[];
  /** Syntax and semantic errors together, in source order. */
  diagnostics: FormulaDiagnostic[];
  /** The type the formula yields, `"any"` when unknown. */
  type: FormulaType;
};

/** Index the functions and fields once, for the checker, the evaluator and the suggestions. */
export function createFormulaEnv(
  functions?: ReadonlyArray<FormulaFunction>,
  fields?: ReadonlyArray<FormulaField> | null,
): FormulaEnv;

/** Find the field a name stands for: the id, then the label, then either with case ignored. */
export function resolveField(
  env: FormulaEnv,
  name: string,
): FormulaField | undefined;

/** The candidate closest to `name`, when one is close enough to be a typo. */
export function closestName(
  name: string,
  candidates: Iterable<string>,
): string | undefined;

/** Visit every node, children first, without recursion. */
export function walkFormula(
  root: FormulaNode,
  visit: (node: FormulaNode) => void,
): void;

/** Check a tree against the functions and fields: unknown names, argument counts and types. */
export function checkFormula(
  ast: FormulaNode,
  env: FormulaEnv,
): { diagnostics: FormulaDiagnostic[]; type: FormulaType };

/** Parse and check a formula: everything but the evaluation. */
export function analyzeFormula(
  source: string,
  options?: {
    env?: FormulaEnv;
    functions?: ReadonlyArray<FormulaFunction>;
    fields?: ReadonlyArray<FormulaField> | null;
    maxDepth?: number;
  },
): FormulaAnalysis;
