// biome-ignore-all lint/suspicious/noExplicitAny: a row's values are whatever the schema converts them to
// biome-ignore-all lint/suspicious/noConfusingVoidType: `void` lets a callback return nothing
export interface ImportFieldOption {
  value: string;
  label?: string;
  aliases?: ReadonlyArray<string>;
}

export interface ImportField {
  key: string;
  label: string;
  type?:
    "string" | "number" | "integer" | "boolean" | "date" | "email" | "enum";
  required?: boolean;
  /** Other names the column may have. */
  aliases?: ReadonlyArray<string>;
  /** The allowed values of an `enum`. */
  options?: ReadonlyArray<string | ImportFieldOption>;
  /**
   * Accepted formats of a `date`: `YYYY-MM-DD`, `MM/DD/YYYY`,
   * `DD/MM/YYYY`, `DD.MM.YYYY` and `serial`. Defaults to ISO.
   */
  dateFormats?: ReadonlyArray<string>;
  /** The decimal mark of a `number`. Defaults to `.`. */
  decimal?: "." | ",";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp | string;
  patternMessage?: string;
  description?: string;
  /** Return a message for a bad value. */
  validate?: (
    value: any,
    record: Record<string, any>,
  ) => string | null | undefined | false | void;
}

export interface ImportMessages {
  required: (field: ImportField) => string;
  number: (field: ImportField) => string;
  integer: (field: ImportField) => string;
  boolean: (field: ImportField) => string;
  date: (field: ImportField) => string;
  email: (field: ImportField) => string;
  enum: (field: ImportField) => string;
  minLength: (field: ImportField, limit: number) => string;
  maxLength: (field: ImportField, limit: number) => string;
  min: (field: ImportField, limit: number) => string;
  max: (field: ImportField, limit: number) => string;
  pattern: (field: ImportField) => string;
  duplicate: (row: number) => string;
  extraValues: (found: number, expected: number) => string;
}

export interface CellTransform {
  /** Overrides the field's `dateFormats` with one format. */
  dateFormat?: string;
  /** Source text (lowercased) to an option value, or `true` / `false` for a boolean. */
  valueMap?: Record<string, string>;
  /** Defaults to `true`. */
  trim?: boolean;
}

export const defaultMessages: ImportMessages;

/** Parse a number, with or without thousands separators. */
export function parseNumber(
  text: string,
  decimal?: "." | ",",
): number | undefined;

/**
 * Parse a date in one of `formats` into `YYYY-MM-DD`. Impossible dates such
 * as 02/30/2024 fail. `serial` accepts a spreadsheet day number.
 */
export function parseDate(
  text: string,
  formats?: ReadonlyArray<string>,
): string | undefined;

/**
 * Convert one cell for a field. Returns the value, or the reason it isn't
 * one. An empty cell is `null`.
 */
export function convertCell(
  field: ImportField,
  raw: string,
  transform?: CellTransform,
  messages?: ImportMessages,
): { value: any } | { error: string };

/**
 * The distinct values of a column that don't match any option of an `enum`
 * (or a boolean word), most frequent first.
 */
export function unmatchedValues(
  field: ImportField,
  values: ReadonlyArray<string>,
  limit?: number,
): Array<{ value: string; count: number }>;

/**
 * The format of a `date` field that reads the most of a column's values.
 * Returns `undefined` for a field with one format or none.
 */
export function detectDateFormat(
  field: ImportField,
  values: ReadonlyArray<string>,
): string | undefined;
