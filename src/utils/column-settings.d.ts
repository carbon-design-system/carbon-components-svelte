export interface ColumnHeader {
  key: string;
  columnHidden?: boolean;
  empty?: boolean;
  [key: string]: unknown;
}

export interface ColumnSettings {
  /** Header keys in display order */
  order: string[];
  /** Keys of hidden columns */
  hidden: string[];
}

/**
 * Convert a header array into a serializable settings object: key order
 * and which keys are hidden. Other header fields (including functions
 * like `display`/`sort`) are dropped, so the result can be persisted as
 * JSON.
 */
export function toColumnSettings(
  headers: ReadonlyArray<ColumnHeader>,
): ColumnSettings;

/**
 * Apply a settings object back onto a header array: reorder by
 * `settings.order` (headers missing from `order` keep their relative
 * order, appended after the ordered ones; keys in `order` with no
 * matching header are ignored) and set `columnHidden` from
 * `settings.hidden`.
 */
export function applyColumnSettings(
  headers: ReadonlyArray<ColumnHeader>,
  settings: ColumnSettings,
): ColumnHeader[];

/**
 * Set `columnHidden` on the header matching `key`. Returns the same
 * array reference when the header is missing or already at the
 * requested state.
 */
export function setColumnHidden(
  headers: ReadonlyArray<ColumnHeader>,
  key: string,
  hidden: boolean,
): ReadonlyArray<ColumnHeader>;
