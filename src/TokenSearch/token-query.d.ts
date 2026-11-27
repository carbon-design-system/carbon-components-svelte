export type TokenKeyType = "enum" | "text" | "date" | "number" | "user";

/** An allowed value of an `enum` or `user` key. */
export type TokenValue = {
  /** What is written after the colon. */
  value: string;
  /** What the menu shows. Defaults to `value`. */
  label?: string;
  /** Muted text beside the label. The query also matches it. */
  description?: string;
};

export type TokenKey = {
  /** What is written before the colon. Letters, digits, `_`, `.` and `-`. */
  key: string;
  /** What the menu shows. Defaults to `key`. */
  label?: string;
  /** Muted text beside the label. */
  description?: string;
  /** @default "text" */
  type?: TokenKeyType;
  /** The values to offer. For an `enum` they are also the only valid ones. */
  values?: ReadonlyArray<string | TokenValue>;
  /** Values for the typed text, synchronously or as a promise. */
  source?: (
    query: string,
    context: { signal: AbortSignal; key: string },
  ) =>
    | ReadonlyArray<string | TokenValue>
    | Promise<ReadonlyArray<string | TokenValue>>;
};

export type TokenOperator = "eq" | "gt" | "gte" | "lt" | "lte" | "between";

export type TokenFilter = {
  /** The schema's spelling of the key, or the typed one when it is not in the schema. */
  key: string;
  op: TokenOperator;
  /**
   * One for a comparison, two for a range (an open end is `""`), any
   * number for `eq`. Dates are ISO `YYYY-MM-DD`; an enum is the schema's `value`.
   */
  values: string[];
  negated: boolean;
  /** Index of the first character. */
  start?: number;
  /** Index after the last character. */
  end?: number;
};

export type TokenTerm = {
  text: string;
  /** Written in quotes. */
  phrase: boolean;
  negated: boolean;
  start?: number;
  end?: number;
};

export type TokenErrorCode =
  | "unknown-key"
  | "missing-value"
  | "invalid-value"
  | "invalid-operator"
  | "unterminated-quote";

export type TokenError = {
  code: TokenErrorCode;
  message: string;
  start: number;
  end: number;
};

export type TokenQuery = {
  /** The free text: its terms, without the negated ones, joined by a space and without quotes. */
  text: string;
  terms: TokenTerm[];
  filters: TokenFilter[];
  errors: TokenError[];
};

export type ParseOptions = {
  /** The schema. Without it every key is accepted as text. */
  keys?: ReadonlyArray<TokenKey>;
  /** What `@today` is relative to. */
  now?: Date;
};

/** One piece of a qualifier's value, with its place in the text. */
export type ValuePiece = {
  text: string;
  start: number;
  end: number;
  quoted: boolean;
  closed: boolean;
};

export type Token = {
  type: "text" | "qualifier";
  start: number;
  end: number;
  negated: boolean;
  /** Index after the `-`. */
  bodyStart: number;
  text?: string;
  phrase?: boolean;
  closed?: boolean;
  key?: string;
  /** Index of the colon. */
  keyEnd?: number;
  pieces?: ValuePiece[];
};

/** Split text into tokens. Total: any string gives a list. */
export function tokenize(input: string): Token[];

/** `YYYY-MM-DD` for a day in the local calendar. */
export function toIsoDate(date: Date): string;

/**
 * Resolve a date as written to `YYYY-MM-DD`: an ISO date, `@today`,
 * `@yesterday` or `@tomorrow`, with an offset such as `@today-7d`. `null`
 * when it is none of them.
 */
export function resolveDate(text: string, now?: Date): string | null;

/** The schema's entry for a key typed in any case. */
export function findKey(
  keys: ReadonlyArray<TokenKey> | undefined,
  key: string,
): TokenKey | undefined;

export function toTokenValue(entry: string | TokenValue): TokenValue;

/** Parse a query. Never throws. */
export function parseQuery(input: string, options?: ParseOptions): TokenQuery;

/** Write one value of a qualifier, quoted when it needs to be. */
export function formatValue(value: string): string;

/** Write a free-text term, quoted when it would read as syntax. */
export function formatTerm(text: string, phrase?: boolean): string;

/** Write one filter, such as `-label:bug,"good first issue"`. */
export function formatFilter(filter: TokenFilter): string;

/**
 * Write a query as text. `parse(format(query))` is `query`, positions aside.
 */
export function formatQuery(
  query: Pick<TokenQuery, "terms" | "filters">,
): string;

/** A query without its positions, to compare two parses. */
export function withoutPositions(query: TokenQuery): {
  text: string;
  terms: Array<Pick<TokenTerm, "text" | "phrase" | "negated">>;
  filters: Array<Pick<TokenFilter, "key" | "op" | "values" | "negated">>;
  errors: TokenErrorCode[];
};
