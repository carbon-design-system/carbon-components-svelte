// @ts-check
// Carbon v11 size names accepted as aliases of this library's own names.
// Each map lists only the v11 names that don't already mean something else
// in that component's API. A v11 name that collides, such as Button's `lg`,
// keeps this library's meaning and has no entry.

/** Button: v11 `sm` 32px, `md` 40px, `2xl` 80px. */
export const BUTTON_SIZE_ALIASES = new Map([
  ["sm", "small"],
  ["md", "field"],
  ["2xl", "xl"],
]);

/**
 * Fields, `Form`, `InputGroup`, `Accordion`, `ContentSwitcher` and
 * `OverflowMenu`: v11 `lg` is 48px, this library's `xl`. v11 `md` needs
 * no entry: it renders the 40px default, and it wins over a `Form` size.
 */
export const FIELD_SIZE_ALIASES = new Map([["lg", "xl"]]);

/** Search: v11 `md` is 40px, this library's `lg`. */
export const SEARCH_SIZE_ALIASES = new Map([["md", "lg"]]);

/** Tag: v11 `md` is the 24px default. */
export const TAG_SIZE_ALIASES = new Map([["md", "default"]]);

/** PinCodeInput: the field aliases, with `"default"` as its default. */
export const PIN_CODE_INPUT_SIZE_ALIASES = new Map([
  ["md", "default"],
  ["lg", "xl"],
]);

/** FileUploaderItem and FileDownloadItem: v11 `sm`, `md` and `lg`. */
export const FILE_ITEM_SIZE_ALIASES = new Map([
  ["sm", "small"],
  ["md", "field"],
  ["lg", "default"],
]);

/** TreeView: v11 `xs` 24px and `sm` 32px. */
export const TREE_VIEW_SIZE_ALIASES = new Map([
  ["xs", "compact"],
  ["sm", "default"],
]);

/** DataTable row heights: v11 `xs` 24px through `xl` 64px. */
export const DATA_TABLE_SIZE_ALIASES = new Map([
  ["xs", "compact"],
  ["sm", "short"],
  ["md", "medium"],
  ["lg", undefined],
  ["xl", "tall"],
]);

/** DataGrid row heights: v11 `xs` 24px through `xl` 64px. */
export const DATA_GRID_SIZE_ALIASES = new Map([
  ["xs", "compact"],
  ["sm", "short"],
  ["md", "medium"],
  ["lg", "default"],
  ["xl", "tall"],
]);

/** DataTable `Toolbar`: v11 `lg` is the 48px default. */
export const TOOLBAR_SIZE_ALIASES = new Map([["lg", "default"]]);

/** ProgressBar: v11 `small` and `big`. */
export const PROGRESS_BAR_SIZE_ALIASES = new Map([
  ["small", "sm"],
  ["big", "md"],
]);

/**
 * Resolve a size alias to the component's own name. Returns any other
 * value unchanged, including `undefined`.
 *
 * @template T
 * @template {string} From
 * @template {string | undefined} To
 * @param {T} size
 * @param {ReadonlyMap<From, To>} aliases
 * @returns {Exclude<T, From> | To}
 */
export function normalizeSize(size, aliases) {
  const key = /** @type {From} */ (/** @type {unknown} */ (size));
  return aliases.has(key)
    ? /** @type {To} */ (aliases.get(key))
    : /** @type {Exclude<T, From>} */ (size);
}
