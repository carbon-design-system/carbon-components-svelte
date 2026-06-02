/** Trap Tab/Shift+Tab within `container`; always calls `event.preventDefault()`. */
export function trapFocus(options: {
  container: Element;
  event: KeyboardEvent;
}): void;
