import type { TokenError } from "./token-query.js";

export type QualifierPart = {
  /** `sign` is the `-`, `key` includes the colon, `separator` is a comma. */
  kind: "sign" | "key" | "value" | "separator";
  text: string;
  /** An error covers this piece. */
  error: boolean;
};

export type TextRun = { type: "text"; text: string };

export type PhraseRun = {
  type: "phrase";
  text: string;
  negated: boolean;
  error: boolean;
};

export type QualifierRun = {
  type: "qualifier";
  negated: boolean;
  error: boolean;
  parts: QualifierPart[];
  start: number;
  end: number;
};

export type HighlightRun = TextRun | PhraseRun | QualifierRun;

/**
 * Cut a query into the runs drawn behind the text. Joined, they are the
 * text exactly.
 */
export function highlightRuns(
  text: string,
  errors?: ReadonlyArray<TokenError>,
): HighlightRun[];
