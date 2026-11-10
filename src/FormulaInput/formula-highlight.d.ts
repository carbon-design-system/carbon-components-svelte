import type { FormulaDiagnostic, FormulaToken } from "./formula-lang.js";

export type HighlightKind =
  | "function"
  | "field"
  | "string"
  | "number"
  | "operator"
  | "punctuation"
  | "name"
  | "constant"
  | "none";

export type HighlightRun = {
  text: string;
  start: number;
  end: number;
  kind: HighlightKind;
  /** Part of a diagnostic's range. */
  error: boolean;
};

/**
 * Cut the source into runs for the layer behind the text. Joined, the runs
 * are the source.
 */
export function highlightRuns(
  source: string,
  tokens: FormulaToken[],
  diagnostics: FormulaDiagnostic[],
  options?: { isField?: (name: string) => boolean },
): HighlightRun[];
