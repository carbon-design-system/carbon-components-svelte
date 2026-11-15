/**
 * Decides whether a focus on a list box's text input should open its menu,
 * for `openOnFocus`: only focus arriving from outside the list box, and not
 * the window regaining focus.
 */
export function createFocusOpener(isInside: (node: Node) => boolean): {
  focus: (event: FocusEvent) => boolean;
  blur: (event: FocusEvent) => void;
};
