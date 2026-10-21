/** Selector for the elements that Tab can reach. */
export const selectorTabbable: string;

/** Trap Tab/Shift+Tab within `container`; always calls `event.preventDefault()`. */
export function trapFocus(options: {
  container: Element;
  event: KeyboardEvent;
}): void;
