export function initialFocus(options: {
  container: Element | null | undefined;
  selectorPrimaryFocus?: string | null;
  fallbacks?: Array<Element | null | undefined>;
}): HTMLElement | null;

/**
 * Move focus to `target` on the library's own initiative, such as a
 * dialog's first focus or focus returned to a trigger. A tooltip on
 * `target` stays closed.
 */
export function focusQuietly(target: HTMLElement, options?: FocusOptions): void;

/**
 * Give a dialog's first target focus quietly, and try once more on the next
 * frame if focus did not land in the dialog (WebKit, for an element created
 * in the update that opens it).
 */
export function focusFirstQuietly(
  target: HTMLElement,
  options: {
    container: Element | null | undefined;
    isOpen: () => boolean;
    focusOptions?: FocusOptions;
  },
): void;

/** Whether focus is moving to `node` through `focusQuietly`. */
export function isQuietFocus(node: Element | null | undefined): boolean;

/**
 * The element the last pointer press landed on, until the next key press.
 * Safari does not focus a button on click, so this is how a control that
 * opened an overlay is known.
 */
export function getPressTarget(): EventTarget | null;

/**
 * Whether focus on `node` came from a pointer press on it, with no key
 * pressed since. A tooltip ignores that focus, so it closes when the
 * pointer leaves.
 */
export function isPointerFocus(node: Element | null | undefined): boolean;

export function restoreFocus(): {
  save(): void;
  restore(region?: Element | null): void;
};

export function returnFocus(
  target: HTMLElement | null | undefined,
  region?: Element | null,
): void;

export function returnFocusOnClose(
  getTrigger: () => HTMLElement | null | undefined,
  getPanel: () => Element | null | undefined,
): (open: boolean) => void;

/**
 * Whether focus was dropped to `<body>` or is still inside `region`: nothing
 * else has claimed it since `region` started closing.
 */
export function focusIsFree(region: Element | null | undefined): boolean;
