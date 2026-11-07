/**
 * Move focus to a field and scroll it into view with its label, so the
 * user sees what the field is for. Like GOV.UK, it scrolls the legend of a
 * radio or checkbox group (or of a fieldset whose legend is near the
 * control) to the top, and focuses the control without scrolling again.
 *
 * Returns the control that took focus, or `false` when nothing in the page
 * matches `fieldId`, so a caller can let a link navigate instead.
 *
 * `fieldId` is the id of a control, or of an element that holds one (a
 * radio group's wrapper): focus goes to the first control inside it, or to
 * the checked radio.
 */
export function focusField(
  fieldId: string,
  options?: {
    /** Clear a fixed header, in pixels, when scrolling the label into view. */
    scrollMargin?: number;
    root?: Document | ShadowRoot;
  },
): HTMLElement | false;

/** The control a field id stands for: the element, or the first inside it. */
export function resolveControl(target: HTMLElement): HTMLElement | null;

/** The label or legend the user reads for a control. */
export function labelFor(control: HTMLElement): HTMLElement | null;
