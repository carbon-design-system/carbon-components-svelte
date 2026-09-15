// @ts-check

/**
 * @typedef {{ key: string; columnHidden?: boolean; empty?: boolean; [key: string]: unknown }} ColumnHeader
 * @typedef {object} ColumnSettings
 * @property {string[]} order - Header keys in display order
 * @property {string[]} hidden - Keys of hidden columns
 */

/**
 * Convert a header array into a serializable settings object: key order and
 * which keys are hidden. Other header fields (including functions like
 * `display`/`sort`) are dropped, so the result can be persisted as JSON.
 * @param {ReadonlyArray<ColumnHeader>} headers
 * @returns {ColumnSettings}
 */
export function toColumnSettings(headers) {
  return {
    order: headers.map((header) => header.key),
    hidden: headers
      .filter((header) => header.columnHidden === true)
      .map((header) => header.key),
  };
}

/**
 * Apply a settings object back onto a header array: reorder by
 * `settings.order` (headers missing from `order` keep their relative order,
 * appended after the ordered ones; keys in `order` with no matching header
 * are ignored) and set `columnHidden` from `settings.hidden`.
 * @param {ReadonlyArray<ColumnHeader>} headers
 * @param {ColumnSettings} settings
 * @returns {ColumnHeader[]}
 */
export function applyColumnSettings(headers, settings) {
  const byKey = new Map(headers.map((header) => [header.key, header]));
  const ordered = settings.order
    .map((key) => byKey.get(key))
    .filter((header) => header !== undefined);
  const orderedKeys = new Set(settings.order);
  const remaining = headers.filter((header) => !orderedKeys.has(header.key));

  return [...ordered, ...remaining].map((header) => ({
    ...header,
    columnHidden: settings.hidden.includes(header.key),
  }));
}

/**
 * Swap a header with its nearest non-empty neighbor in the given direction.
 * Returns the same array reference when the key is missing or there is no
 * such neighbor (e.g. moving the first/last non-empty header further).
 * @param {ReadonlyArray<ColumnHeader>} headers
 * @param {string} key
 * @param {-1 | 1} direction
 * @returns {ReadonlyArray<ColumnHeader>}
 */
export function moveColumn(headers, key, direction) {
  const index = headers.findIndex((header) => header.key === key);
  if (index === -1) return headers;

  let neighborIndex = index + direction;
  while (
    neighborIndex >= 0 &&
    neighborIndex < headers.length &&
    headers[neighborIndex].empty === true
  ) {
    neighborIndex += direction;
  }
  if (neighborIndex < 0 || neighborIndex >= headers.length) return headers;

  const next = headers.slice();
  next[index] = headers[neighborIndex];
  next[neighborIndex] = headers[index];
  return next;
}

/**
 * Set `columnHidden` on the header matching `key`. Returns the same array
 * reference when the header is missing or already at the requested state.
 * @param {ReadonlyArray<ColumnHeader>} headers
 * @param {string} key
 * @param {boolean} hidden
 * @returns {ReadonlyArray<ColumnHeader>}
 */
export function setColumnHidden(headers, key, hidden) {
  const index = headers.findIndex((header) => header.key === key);
  if (index === -1 || !!headers[index].columnHidden === hidden) return headers;

  const next = headers.slice();
  next[index] = { ...next[index], columnHidden: hidden };
  return next;
}
