/**
 * Lightweight deep equality check optimized for DataTable rows.
 * Compares arrays of row objects by first checking IDs (fast path),
 * then falling back to deep object comparison to handle nested structures.
 */
export function rowsEqual<T>(
  a: ReadonlyArray<T> | null,
  b: ReadonlyArray<T> | null,
): boolean;

/**
 * Returns true if the element's class list indicates the click target
 * is an overflow menu, checkbox, or radio button (row click should be ignored).
 */
export function shouldIgnoreRowClick(target: EventTarget | null): boolean;

/**
 * Resolves a nested property path in an object.
 * Supports both direct property access and nested paths like "contact.company".
 */
export function resolvePath<T extends Record<string, unknown>>(
  object: T,
  path: string,
): unknown;

/**
 * Paginates an array of rows based on page number and page size.
 */
export function getDisplayedRows<Row extends Record<string, unknown>>(
  rows: ReadonlyArray<Row>,
  page: number,
  pageSize: number,
): ReadonlyArray<Row>;

/**
 * Formats header width styles for table headers.
 * Combines width and minWidth into a CSS style string.
 */
export function formatHeaderWidth<
  Header extends {
    width?: string | null | number;
    minWidth?: string | null | number;
    [key: string]: unknown;
  } = {
    width?: string | null | number;
    minWidth?: string | null | number;
    [key: string]: unknown;
  },
>(header: Header): string | undefined;

/**
 * Compares two values for sorting in a data table.
 * Handles numbers, strings, null/undefined values, and custom sort functions.
 * @returns {number} Negative if a < b (ascending) or a > b (descending), positive if a > b (ascending) or a < b (descending), 0 if equal
 */
export function compareValues<T = unknown>(
  itemA: T,
  itemB: T,
  ascending: boolean,
  customSort?: ((a: T, b: T) => number) | false | undefined,
): number;

export type ToCsvHeader<Row> = {
  /** Column key. Supports nested paths like `"contact.company"`. */
  key: string;
  /** Column label written to the header row. Falls back to `key`. */
  value?: unknown;
  /** Whether the column renders no data. Empty columns are skipped. */
  empty?: boolean;
  /** Whether the column is hidden. Hidden columns are skipped. */
  columnHidden?: boolean;
  /** Formats the cell value, matching the rendered table. */
  display?: (item: unknown, row: Row) => unknown;
};

export type ToCsvOptions = {
  /**
   * Field delimiter. Set to `"\t"` for TSV or `";"` for locales where
   * Excel expects it.
   * @default ","
   */
  delimiter?: string;
  /**
   * Emit the header row.
   * @default true
   */
  includeHeaders?: boolean;
  /**
   * Prefix a field starting with `=`, `+`, `-`, `@`, tab, or carriage return
   * with a single quote so spreadsheets do not evaluate it as a formula.
   * @default true
   */
  escapeFormulas?: boolean;
  /**
   * Line ending. RFC 4180 specifies `"\r\n"`, which is what Excel expects.
   * @default "\r\n"
   */
  newline?: string;
};

/**
 * Serializes data table headers and rows to a CSV string.
 * Skips empty and hidden columns, resolves nested keys, and applies `display`
 * formatting so the export matches the rendered table.
 */
export function toCsv<Row extends Record<string, unknown>>(
  headers: ReadonlyArray<ToCsvHeader<Row>>,
  rows: ReadonlyArray<Row>,
  options?: ToCsvOptions,
): string;

type PathDepth = [never, 0, 1, 2, ...0[]];

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

/**
 * Drops string/number index signatures so `keyof` is only declared keys.
 * Used for paths on `DataTableRow` and subtypes, whose index signature would
 * otherwise widen `PropertyPath` to plain `string`.
 */
export type KeysWithoutIndexSignature<T> = {
  [
    K in keyof T as string extends K ? never : number extends K ? never : K
  ]: T[K];
};

// For performance, the maximum traversal depth is 3.
export type PropertyPath<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | Join<K, PropertyPath<T[K], PathDepth[D]>>
          : never;
      }[keyof T]
    : "";

/**
 * Like {@link PropertyPath}, but ignores string/number index signatures at
 * each object level so declared keys stay as literal unions (for `DataTableRow` subtypes).
 */
export type PropertyPathIgnoringIndexSignatures<T, D extends number = 3> = [
  D,
] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof KeysWithoutIndexSignature<T>]-?: K extends string | number
          ? | `${K}`
            | Join<
                K,
                PropertyPathIgnoringIndexSignatures<
                  KeysWithoutIndexSignature<T>[K],
                  PathDepth[D]
                >
              >
          : never;
      }[keyof KeysWithoutIndexSignature<T>]
    : "";

/**
 * Cell value type at a column path (e.g. `"port"` or `"contact.company"`).
 */
export type DataTableValueAtPath<Row, Path extends string> = Row extends object
  ? Path extends keyof Row & string
    ? Row[Path]
    : Path extends `${infer Head}.${infer Rest}`
      ? Head extends keyof Row
        ? DataTableValueAtPath<NonNullable<Row[Head]>, Rest>
        : unknown
      : unknown
  : unknown;

/**
 * Union of cell value types for all column paths on `Row`.
 * Used for default and per-column `sort` comparators.
 *
 * `Row` is unconstrained so generated `DataTableSortValue<Row = DataTableRow>` aliases stay valid;
 * non-object `Row` resolves to `never`.
 */
export type DataTableSortValue<Row> = Row extends object
  ? PropertyPath<Row> extends infer K
    ? K extends string
      ? DataTableValueAtPath<Row, K>
      : never
    : never
  : never;

/** The narrowest a resized column gets. */
export const MIN_COLUMN_WIDTH: number;

/** Where a column without a `maxWidth` stops growing. */
export const MAX_COLUMN_WIDTH: number;

/**
 * A length in pixels: a number, or `"120px"`. Anything else has no pixel
 * width until it is laid out.
 */
export function parsePixelWidth(
  value: string | number | null | undefined,
): number | undefined;

/** The pixel range a column can be resized to. */
export function resolveColumnBounds(header: {
  minWidth?: string | number | null;
  maxWidth?: string | number | null;
}): { min: number; max: number };

/** The least an unsized resizable column takes before the first drag. */
export const UNSIZED_COLUMN_MIN_WIDTH: string;

/**
 * The table's minimum width while a column is still unsized, so a narrow
 * container scrolls the fixed layout instead of squeezing it.
 */
export function formatTableMinWidth(
  leading: ReadonlyArray<string>,
  headers: ReadonlyArray<{
    key: string;
    width?: string | number | null;
    minWidth?: string | number | null;
  }>,
  widths: Record<string, number | undefined>,
): string;

/**
 * The table's width once every column has a pixel width, or `undefined`
 * while any is unsized.
 */
export function formatTableWidth(
  leading: ReadonlyArray<string>,
  headers: ReadonlyArray<{ key: string }>,
  widths: Record<string, number | undefined>,
): string | undefined;

/** CSS lengths of the leading columns in render order. */
export function leadingColumnLengths(
  decorator: boolean,
  expand: boolean,
  selection: boolean,
): string[];
