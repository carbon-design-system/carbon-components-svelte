// @ts-check
// Carbon v11 size names accepted as aliases of this library's own names.
// Each helper lists only the v11 names that don't already mean something
// else in that component's API. A v11 name that collides, such as Button's
// `lg`, keeps this library's meaning and has no case. Any other value comes
// back unchanged, including `undefined`.
//
// Each helper is a plain chain of `===` checks so CSS optimizers can follow
// it and prune the size classes an app never renders. A lookup in an
// exported `Map` or object hides the result from them.

/**
 * Button: v11 `sm` 32px, `md` 40px, `2xl` 80px.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "sm" | "md" | "2xl"> | "small" | "field" | "xl"}
 */
export function normalizeButtonSize(size) {
  if (size === "sm") return "small";
  if (size === "md") return "field";
  if (size === "2xl") return "xl";
  return /** @type {Exclude<T, "sm" | "md" | "2xl">} */ (size);
}

/**
 * Fields, `Form`, `InputGroup`, `Accordion`, `ContentSwitcher` and
 * `OverflowMenu`: v11 `lg` is 48px, this library's `xl`. v11 `md` needs
 * no case: it renders the 40px default, and it wins over a `Form` size.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "lg"> | "xl"}
 */
export function normalizeFieldSize(size) {
  if (size === "lg") return "xl";
  return /** @type {Exclude<T, "lg">} */ (size);
}

/**
 * Search: v11 `md` is 40px, this library's `lg`.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "md"> | "lg"}
 */
export function normalizeSearchSize(size) {
  if (size === "md") return "lg";
  return /** @type {Exclude<T, "md">} */ (size);
}

/**
 * Tag: v11 `md` is the 24px default.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "md"> | "default"}
 */
export function normalizeTagSize(size) {
  if (size === "md") return "default";
  return /** @type {Exclude<T, "md">} */ (size);
}

/**
 * PinCodeInput: the field aliases, with `"default"` as its default.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "md" | "lg"> | "default" | "xl"}
 */
export function normalizePinCodeInputSize(size) {
  if (size === "md") return "default";
  if (size === "lg") return "xl";
  return /** @type {Exclude<T, "md" | "lg">} */ (size);
}

/**
 * FileUploaderItem and FileDownloadItem: v11 `sm`, `md` and `lg`.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "sm" | "md" | "lg"> | "small" | "field" | "default"}
 */
export function normalizeFileItemSize(size) {
  if (size === "sm") return "small";
  if (size === "md") return "field";
  if (size === "lg") return "default";
  return /** @type {Exclude<T, "sm" | "md" | "lg">} */ (size);
}

/**
 * TreeView: v11 `xs` 24px and `sm` 32px.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "xs" | "sm"> | "compact" | "default"}
 */
export function normalizeTreeViewSize(size) {
  if (size === "xs") return "compact";
  if (size === "sm") return "default";
  return /** @type {Exclude<T, "xs" | "sm">} */ (size);
}

/**
 * DataTable row heights: v11 `xs` 24px through `xl` 64px. v11 `lg` is
 * the 48px default, so it resolves to `undefined`.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "xs" | "sm" | "md" | "lg" | "xl"> | "compact" | "short" | "medium" | "tall" | undefined}
 */
export function normalizeDataTableSize(size) {
  if (size === "xs") return "compact";
  if (size === "sm") return "short";
  if (size === "md") return "medium";
  if (size === "lg") return undefined;
  if (size === "xl") return "tall";
  return /** @type {Exclude<T, "xs" | "sm" | "md" | "lg" | "xl">} */ (size);
}

/**
 * DataTable `Toolbar`: v11 `lg` is the 48px default.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "lg"> | "default"}
 */
export function normalizeToolbarSize(size) {
  if (size === "lg") return "default";
  return /** @type {Exclude<T, "lg">} */ (size);
}

/**
 * ProgressBar: v11 `small` and `big`.
 *
 * @template T
 * @param {T} size
 * @returns {Exclude<T, "small" | "big"> | "sm" | "md"}
 */
export function normalizeProgressBarSize(size) {
  if (size === "small") return "sm";
  if (size === "big") return "md";
  return /** @type {Exclude<T, "small" | "big">} */ (size);
}
