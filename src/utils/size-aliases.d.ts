/**
 * Carbon v11 size names accepted as aliases of this library's own names.
 * Each helper lists only the v11 names that don't already mean something
 * else in that component's API. Any other value comes back unchanged.
 */

/**
 * Button: v11 `sm` 32px, `md` 40px, `2xl` 80px.
 */
export function normalizeButtonSize<T>(
  size: T,
): Exclude<T, "sm" | "md" | "2xl"> | "small" | "field" | "xl";

/**
 * Fields, `Form`, `InputGroup`, `Accordion`, `ContentSwitcher` and
 * `OverflowMenu`: v11 `lg` is 48px, this library's `xl`. v11 `md` needs
 * no case: it renders the 40px default, and it wins over a `Form` size.
 */
export function normalizeFieldSize<T>(size: T): Exclude<T, "lg"> | "xl";

/**
 * Search: v11 `md` is 40px, this library's `lg`.
 */
export function normalizeSearchSize<T>(size: T): Exclude<T, "md"> | "lg";

/**
 * Tag: v11 `md` is the 24px default.
 */
export function normalizeTagSize<T>(size: T): Exclude<T, "md"> | "default";

/**
 * PinCodeInput: the field aliases, with `"default"` as its default.
 */
export function normalizePinCodeInputSize<T>(
  size: T,
): Exclude<T, "md" | "lg"> | "default" | "xl";

/**
 * FileUploaderItem and FileDownloadItem: v11 `sm`, `md` and `lg`.
 */
export function normalizeFileItemSize<T>(
  size: T,
): Exclude<T, "sm" | "md" | "lg"> | "small" | "field" | "default";

/**
 * TreeView: v11 `xs` 24px and `sm` 32px.
 */
export function normalizeTreeViewSize<T>(
  size: T,
): Exclude<T, "xs" | "sm"> | "compact" | "default";

/**
 * DataTable row heights: v11 `xs` 24px through `xl` 64px. v11 `lg` is
 * the 48px default, so it resolves to `undefined`.
 */
export function normalizeDataTableSize<T>(
  size: T,
):
  | Exclude<T, "xs" | "sm" | "md" | "lg" | "xl">
  | "compact"
  | "short"
  | "medium"
  | "tall"
  | undefined;

/**
 * DataTable `Toolbar`: v11 `lg` is the 48px default.
 */
export function normalizeToolbarSize<T>(size: T): Exclude<T, "lg"> | "default";

/**
 * ProgressBar: v11 `small` and `big`.
 */
export function normalizeProgressBarSize<T>(
  size: T,
): Exclude<T, "small" | "big"> | "sm" | "md";
