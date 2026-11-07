// biome-ignore-all lint/suspicious/noExplicitAny: a row's values are whatever the schema converts them to
// biome-ignore-all lint/suspicious/noConfusingVoidType: `void` lets a callback return nothing
import type { CellTransform, ImportField, ImportMessages } from "./schema.js";

export const ROW_ERROR: "$row";

export interface SessionConfig {
  fields: ReadonlyArray<ImportField>;
  headers: ReadonlyArray<string>;
  /** Rectangular rows (see `toTable`). The session edits them in place. */
  rows: string[][];
  /** The field key for each source column. */
  mapping: ReadonlyArray<string | null>;
  transforms?: Record<string, CellTransform>;
  /** Rows sharing this field's value are duplicates. */
  keyField?: string;
  /** Defaults to `"skip"`. */
  duplicates?: "skip" | "error" | "keep";
  messages?: Partial<ImportMessages>;
  /** Rows that had more cells than the header (see `toTable`). */
  long?: Map<number, number>;
  /** The row number shown for `rows[0]`. Defaults to 2 (one header row). */
  firstRowNumber?: number;
  validateRow?: (
    record: Record<string, any>,
    index: number,
  ) => string | Record<string, string> | null | undefined | void;
}

export interface ImportSummary {
  /** Rows read, minus the removed ones. */
  total: number;
  valid: number;
  /** Rows with at least one problem. */
  errors: number;
  /** Rows repeating an earlier key, without other problems. */
  duplicates: number;
  removed: number;
}

export interface ImportContext {
  signal: AbortSignal;
  /** Zero-based index of this chunk. */
  chunk: number;
  chunks: number;
  /** Rows imported before this chunk. */
  offset: number;
}

export interface ImportProgress {
  /** Rows handed to `onImport` so far. */
  done: number;
  total: number;
  failed: number;
}

export interface ImportFailure {
  /** The row's index in the file's data rows. */
  index: number;
  /** The row number in the file. */
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  failed: ImportFailure[];
  /** Rows not attempted because the import was canceled or stopped. */
  remaining: number;
  canceled: boolean;
  total: number;
}

export type ImportReply =
  | void
  | undefined
  | { errors?: ReadonlyArray<{ index: number; message: string }> };

export interface ImportSession {
  /** The fields that have a column. */
  fields: ImportField[];
  rows: string[][];
  columnOf: Map<string, number>;
  firstRowNumber: number;
  keyField: string | undefined;
  /** Check every row, yielding to the page between slices. */
  validate(options?: {
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
    sliceMs?: number;
  }): Promise<void>;
  revalidate(id: number): void;
  /** Edit a cell and check its row again. */
  setCell(id: number, fieldKey: string, text: string): void;
  removeRows(ids: Iterable<number>): void;
  removeErrorRows(): void;
  /**
   * Replace text in the rows that have a problem in this field (or in every
   * row, with `onlyErrors: false`). Returns the number of cells changed.
   */
  replaceInColumn(
    fieldKey: string,
    change: {
      find: string;
      replace: string;
      matchCase?: boolean;
      whole?: boolean;
      onlyErrors?: boolean;
    },
  ): number;
  /**
   * Hand the valid rows to `onImport` in chunks. A chunk that throws fails
   * its rows and the import goes on (unless `stopOnError`). An abort stops
   * after the chunk in flight.
   */
  run(
    onImport: (
      records: Array<Record<string, any>>,
      context: ImportContext,
    ) => ImportReply | Promise<ImportReply>,
    options?: {
      chunkSize?: number;
      signal?: AbortSignal;
      stopOnError?: boolean;
      onProgress?: (progress: ImportProgress) => void;
    },
  ): Promise<ImportResult>;
  /** The rows that weren't imported, with the reason, ready for a CSV. */
  report(result?: ImportResult): { headers: string[]; rows: string[][] };
  /** The converted values of a row. */
  toRecord(id: number): Record<string, any>;
  summary(): ImportSummary;
  errorIds(): number[];
  duplicateIds(): number[];
  isRemoved(id: number): boolean;
  /** The messages for a row, by field key (and `ROW_ERROR`). */
  problems(id: number): Record<string, string>;
}

/**
 * The state of one import: the rows, the mapping, each row's problems, and
 * the work on them. It has no DOM and no reactivity, so a store, a component
 * or a test can drive it.
 */
export function createImportSession(config: SessionConfig): ImportSession;
