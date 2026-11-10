export type KeyValueSyntax = "env" | "headers" | "json";

export type ParsedEntry = {
  key: string;
  value: string;
  /** 1-based line, or for JSON the 1-based entry number. */
  line: number;
  /** `false` for a commented-out entry read with `disabledComments`. */
  enabled?: boolean;
};

export type ParseErrorCode =
  | "no-separator"
  | "empty-key"
  | "unterminated-quote"
  | "trailing-characters"
  | "invalid-json"
  | "not-an-object"
  | "nested-value"
  | "too-large";

export type ParseError = {
  /** 1-based line, or for JSON the 1-based entry number; `0` for the whole text. */
  line: number;
  code: ParseErrorCode;
};

export type ParseResult = {
  entries: ParsedEntry[];
  errors: ParseError[];
  syntax: KeyValueSyntax;
  /** `true` when `maxEntries` cut the list short. */
  truncated: boolean;
};

export type ParseOptions = {
  /**
   * Longest text to read, in UTF-16 units.
   * @default 1000000
   */
  maxLength?: number;
  /**
   * Most entries to return.
   * @default 5000
   */
  maxEntries?: number;
  /**
   * Read `# KEY=value` as a disabled entry.
   * @default false
   */
  disabledComments?: boolean;
};

export type SerializableRow = {
  key: string;
  value: string;
  enabled?: boolean;
  stored?: boolean;
};

export type SerializeOptions = {
  /**
   * What to do with a row whose `enabled` is `false`.
   * @default "skip"
   */
  disabled?: "skip" | "comment";
  /**
   * JSON only: write `[{ "key", "value" }]` so duplicate keys and order survive.
   * @default false
   */
  array?: boolean;
};

export const DEFAULT_MAX_LENGTH: number;
export const DEFAULT_MAX_ENTRIES: number;

/** Parse `.env` text: `KEY=value`, `export`, comments, quotes and multi-line quoted values. */
export function parseDotenv(text: string, options?: ParseOptions): ParseResult;

/** Parse `Name: value` header lines. */
export function parseHeaders(text: string, options?: ParseOptions): ParseResult;

/** Parse a JSON object or an array of `{ key, value }` pairs. */
export function parseJson(text: string, options?: ParseOptions): ParseResult;

/** Guess the syntax of pasted text. Returns `undefined` for plain text. */
export function detectSyntax(text: string): KeyValueSyntax | undefined;

/** Parse text as `syntax`, or let the text decide with `"auto"`. */
export function parseKeyValue(
  text: string,
  syntax?: KeyValueSyntax | "auto",
  options?: ParseOptions,
): ParseResult;

/** Write rows as `.env` lines. */
export function serializeDotenv(
  rows: ReadonlyArray<SerializableRow>,
  options?: SerializeOptions,
): string;

/** Write rows as `Name: value` lines. */
export function serializeHeaders(
  rows: ReadonlyArray<SerializableRow>,
  options?: SerializeOptions,
): string;

/** Write rows as a JSON object, or with `array: true` a list of `{ key, value }`. */
export function serializeJson(
  rows: ReadonlyArray<SerializableRow>,
  options?: SerializeOptions,
): string;

/** Write rows in `syntax`. */
export function serializeKeyValue(
  rows: ReadonlyArray<SerializableRow>,
  syntax: KeyValueSyntax,
  options?: SerializeOptions,
): string;
