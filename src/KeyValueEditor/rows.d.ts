export type KeyValueRow = {
  key: string;
  value: string;
  /** Mask the value and offer a reveal button. */
  secret?: boolean;
  /**
   * A secret that is saved on the server but not known here. The row shows
   * a mask and a Replace button, and holds no value.
   */
  stored?: boolean;
  /**
   * `false` for a row that is kept but not used.
   * @default true
   */
  enabled?: boolean;
  description?: string;
  /** The id of one of the editor's `scopes`; empty means all. */
  scope?: string;
};

export type IssueCode =
  | "key-required"
  | "key-pattern"
  | "key-duplicate"
  | "key-reserved"
  | "key-too-long"
  | "value-too-long"
  | "value-invalid"
  | "custom";

export type FieldIssue = {
  code: IssueCode;
  severity: "error" | "warn";
  /** The consumer's text, for `"custom"`. */
  message?: string;
  /** The limit that was passed, for the length codes. */
  limit?: number;
};

export type RowIssues = { key?: FieldIssue; value?: FieldIssue };

export type ValidationResult = {
  /** One entry per row; `undefined` for a row with no issue. */
  rows: (RowIssues | undefined)[];
  /** Rows that have an error. */
  errors: number;
  /** Rows that have a warning and no error. */
  warnings: number;
};

export type ValidateOptions = {
  /** Keys must match. `null` for any key. */
  keyPattern?: RegExp | null;
  /**
   * Compare keys for duplicates without case.
   * @default false
   */
  caseInsensitiveKeys?: boolean;
  /** @default "error" */
  duplicateKeys?: "error" | "warn" | "allow";
  /**
   * Rows with different scopes may share a key.
   * @default false
   */
  scoped?: boolean;
  maxKeyLength?: number;
  maxValueLength?: number;
  reservedKeys?: ReadonlyArray<string> | ((key: string) => boolean);
  /** A value that matches is rejected with `"value-invalid"`. */
  valuePattern?: RegExp;
  /** Runs last; each string is an error message. */
  validate?: (
    row: KeyValueRow,
    index: number,
    rows: ReadonlyArray<KeyValueRow>,
  ) => { key?: string; value?: string } | undefined | void;
};

/** Letters, digits and underscore; not a digit first. */
export const ENV_KEY_PATTERN: RegExp;
/** An HTTP field name: RFC 9110 `token`. */
export const HEADER_NAME_PATTERN: RegExp;
/** No `=`, no line break, no space at either end. */
export const PLAIN_KEY_PATTERN: RegExp;

/** The validation defaults of a `format`. */
export function formatDefaults(
  format: "env" | "headers" | "plain",
): ValidateOptions;

/** Check every row. */
export function validateRows(
  rows: ReadonlyArray<KeyValueRow>,
  options?: ValidateOptions,
): ValidationResult;

/** Turn rows into a plain object. Blank, stored and disabled rows are skipped. */
export function toRecord(
  rows: ReadonlyArray<KeyValueRow>,
): Record<string, string>;

/** Turn a plain object into rows, in key order. */
export function fromRecord(
  record: Readonly<Record<string, unknown>>,
): KeyValueRow[];

/** Move one row. A move outside the list is clamped. */
export function moveRow<T>(
  rows: ReadonlyArray<T>,
  from: number,
  to: number,
): ReadonlyArray<T>;

/** Put parsed entries into a list of rows. */
export function mergeEntries(
  rows: ReadonlyArray<KeyValueRow>,
  entries: ReadonlyArray<{ key: string; value: string; enabled?: boolean }>,
  options?: {
    replace?: number;
    caseInsensitive?: boolean;
    limit?: number;
    defaults?: Partial<KeyValueRow>;
  },
): {
  rows: KeyValueRow[];
  added: number;
  updated: number;
  skipped: number;
  firstIndex: number;
};

/** Rebuild rows from edited text, keeping each row's flags by key. */
export function rowsFromEntries(
  entries: ReadonlyArray<{ key: string; value: string; enabled?: boolean }>,
  base: ReadonlyArray<KeyValueRow>,
  options?: { caseInsensitive?: boolean },
): KeyValueRow[];

/** Read the rows a native form post made. */
export function rowsFromFormData(
  data: FormData | URLSearchParams,
  name: string,
): KeyValueRow[];
