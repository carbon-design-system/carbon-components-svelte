export type FormulaTokenType =
  | "number"
  | "string"
  | "field"
  | "name"
  | "operator"
  | "lparen"
  | "rparen"
  | "comma"
  | "space"
  | "error";

export type FormulaToken = {
  type: FormulaTokenType;
  /** Offset of the first code unit. */
  start: number;
  /** Offset after the last code unit. */
  end: number;
  /** The decoded value: the number, the text of a string, or the name of a field. */
  value?: string | number;
  /** Why an `error` token, or an unterminated string or field, is wrong. */
  message?: string;
  /** `false` for a string or field that has no closing character. */
  closed?: boolean;
};

export type FormulaDiagnostic = {
  /** A stable code such as `"unclosed-paren"`. */
  code: string;
  message: string;
  start: number;
  end: number;
};

type NodeBase = { start: number; end: number };

export type FormulaNumberNode = NodeBase & { type: "number"; value: number };
export type FormulaStringNode = NodeBase & { type: "string"; value: string };
export type FormulaBooleanNode = NodeBase & {
  type: "boolean";
  value: boolean;
};
export type FormulaFieldNode = NodeBase & { type: "field"; name: string };
export type FormulaNameNode = NodeBase & { type: "name"; name: string };
export type FormulaGroupNode = NodeBase & {
  type: "group";
  expr: FormulaNode;
};
export type FormulaUnaryNode = NodeBase & {
  type: "unary";
  op: string;
  arg: FormulaNode;
  opEnd: number;
};
export type FormulaBinaryNode = NodeBase & {
  type: "binary";
  op: string;
  left: FormulaNode;
  right: FormulaNode;
  opStart: number;
  opEnd: number;
};
export type FormulaCallNode = NodeBase & {
  type: "call";
  name: string;
  nameStart: number;
  nameEnd: number;
  args: FormulaNode[];
  close: number;
};
export type FormulaErrorNode = NodeBase & { type: "error" };

export type FormulaNode =
  | FormulaNumberNode
  | FormulaStringNode
  | FormulaBooleanNode
  | FormulaFieldNode
  | FormulaNameNode
  | FormulaGroupNode
  | FormulaUnaryNode
  | FormulaBinaryNode
  | FormulaCallNode
  | FormulaErrorNode;

export type FormulaParseResult = {
  /** `null` for an empty formula. */
  ast: FormulaNode | null;
  /** Every token, spaces included. Joined, their text is the source. */
  tokens: FormulaToken[];
  /** Syntax errors, in source order. */
  diagnostics: FormulaDiagnostic[];
};

export type FormulaParseOptions = {
  /** Deepest nesting of groups, calls and prefix operators. Default `128`. */
  maxDepth?: number;
};

export const DEFAULT_MAX_DEPTH: number;

/** Diagnostics kept per formula. */
export const MAX_DIAGNOSTICS: number;

/** Matches a whole string that can be written without braces. */
export const BARE_NAME: RegExp;

/** Escape a field name for use in braces. */
export function escapeFieldName(name: string): string;

/**
 * Whether a name can stand without braces: it is a plain name and no word
 * the language gives a meaning to.
 */
export function isBareName(name: string): boolean;

/** Split `source` into tokens. Never throws. */
export function tokenize(source: string): FormulaToken[];

/**
 * Parse `source`. Never throws, whatever the text, and always returns: every
 * loop consumes a token or ends, and nesting stops at `maxDepth`.
 */
export function parseFormula(
  source: string,
  options?: FormulaParseOptions,
): FormulaParseResult;
