/**
 * Carbon v11 size names accepted as aliases of this library's own names.
 * Each map lists only the v11 names that don't already mean something else
 * in that component's API.
 */

/** Button: v11 `sm` 32px, `md` 40px, `2xl` 80px. */
export const BUTTON_SIZE_ALIASES: ReadonlyMap<
  "sm" | "md" | "2xl",
  "small" | "field" | "xl"
>;

/**
 * Fields, `Form`, `InputGroup`, `Accordion`, `ContentSwitcher` and
 * `OverflowMenu`: v11 `lg` is 48px, this library's `xl`.
 */
export const FIELD_SIZE_ALIASES: ReadonlyMap<"lg", "xl">;

/** Search: v11 `md` is 40px, this library's `lg`. */
export const SEARCH_SIZE_ALIASES: ReadonlyMap<"md", "lg">;

/** Tag: v11 `md` is the 24px default. */
export const TAG_SIZE_ALIASES: ReadonlyMap<"md", "default">;

/** PinCodeInput: the field aliases, with `"default"` as its default. */
export const PIN_CODE_INPUT_SIZE_ALIASES: ReadonlyMap<
  "md" | "lg",
  "default" | "xl"
>;

/** FileUploaderItem and FileDownloadItem: v11 `sm`, `md` and `lg`. */
export const FILE_ITEM_SIZE_ALIASES: ReadonlyMap<
  "sm" | "md" | "lg",
  "small" | "field" | "default"
>;

/** TreeView: v11 `xs` 24px and `sm` 32px. */
export const TREE_VIEW_SIZE_ALIASES: ReadonlyMap<
  "xs" | "sm",
  "compact" | "default"
>;

/** DataTable row heights: v11 `xs` 24px through `xl` 64px. */
export const DATA_TABLE_SIZE_ALIASES: ReadonlyMap<
  "xs" | "sm" | "md" | "lg" | "xl",
  "compact" | "short" | "medium" | "tall" | undefined
>;

/** DataGrid row heights: v11 `xs` 24px through `xl` 64px. */
export const DATA_GRID_SIZE_ALIASES: ReadonlyMap<
  "xs" | "sm" | "md" | "lg" | "xl",
  "compact" | "short" | "medium" | "default" | "tall"
>;

/** DataTable `Toolbar`: v11 `lg` is the 48px default. */
export const TOOLBAR_SIZE_ALIASES: ReadonlyMap<"lg", "default">;

/** ProgressBar: v11 `small` and `big`. */
export const PROGRESS_BAR_SIZE_ALIASES: ReadonlyMap<
  "small" | "big",
  "sm" | "md"
>;

/**
 * Resolve a size alias to the component's own name. Returns any other
 * value unchanged, including `undefined`.
 */
export function normalizeSize<
  T,
  From extends string,
  To extends string | undefined,
>(size: T, aliases: ReadonlyMap<From, To>): Exclude<T, From> | To;
