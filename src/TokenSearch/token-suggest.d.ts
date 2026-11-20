import type { TokenKey, TokenValue } from "./token-query.js";

export type SuggestContext = {
  kind: "key" | "value";
  /** First character a choice replaces. */
  start: number;
  /** Index after the last character a choice replaces. */
  end: number;
  /** The text between `start` and the caret. */
  prefix: string;
  /** The word starts with `-`. */
  negated: boolean;
  /** For a key: a colon already follows it. */
  colon?: boolean;
  /** For a value: the key as typed. */
  key?: string;
  /** For a value: the schema's entry for the key. */
  def?: TokenKey;
  /** For a value: the other values of the list. */
  taken?: string[];
  /** For a value: a comparison operator or a range was typed. */
  operator?: boolean;
  /** For a value: where the whole piece starts, operator included. */
  pieceStart?: number;
  /** For a value: where the whole piece ends. */
  pieceEnd?: number;
};

export type TokenSuggestion = {
  kind: "key" | "value" | "preset" | "recent";
  /** What the row shows. */
  text: string;
  /** What a choice writes. */
  value: string;
  secondary?: string;
  disabled?: boolean;
};

export type DatePreset = {
  label: string;
  value: string;
  /** Written after an operator the user typed. */
  operand?: boolean;
};

export type Insertion = {
  start: number;
  end: number;
  insert: string;
  caret: number;
  /** Whether the next menu should open at once: after a key, its values. */
  reopen: boolean;
};

/** What the caret is on, or `null` where nothing is offered. */
export function suggestContext(
  text: string,
  caret: number,
  keys: ReadonlyArray<TokenKey> | undefined,
): SuggestContext | null;

/** Lowercase and drop accents. */
export function foldText(text: string | undefined): string;

export function filterSuggestions<
  T extends { text: string; secondary?: string; match?: string },
>(items: ReadonlyArray<T>, query: string, limit?: number): T[];

export function keyItems(
  keys: ReadonlyArray<TokenKey>,
  prefix: string,
  limit?: number,
): TokenSuggestion[];

export const DEFAULT_DATE_PRESETS: ReadonlyArray<DatePreset>;

export function valueItems(
  def: TokenKey,
  prefix: string,
  options?: {
    taken?: ReadonlyArray<string>;
    operator?: boolean;
    limit?: number;
    presets?: ReadonlyArray<DatePreset>;
  },
): TokenSuggestion[];

export function sourceItems(
  entries: ReadonlyArray<string | TokenValue>,
  options?: { taken?: ReadonlyArray<string>; limit?: number },
): TokenSuggestion[];

export function recentItems(
  queries: ReadonlyArray<string>,
  text: string,
  limit?: number,
): TokenSuggestion[];

/** Write a choice into `text`. */
export function buildInsertion(
  text: string,
  context: SuggestContext,
  item: TokenSuggestion,
): Insertion;
