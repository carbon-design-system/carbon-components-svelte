/** Whether a key belongs to the control that has focus, not the toolbar. */
export function controlOwnsKey(
  target: EventTarget | null,
  key: string,
): boolean;

/**
 * Whether the caret of a single-line text field is at the edge a Left or
 * Right key would leave by, with nothing selected.
 */
export function caretAtEdge(
  target: EventTarget | null,
  direction: "previous" | "next",
): boolean;
