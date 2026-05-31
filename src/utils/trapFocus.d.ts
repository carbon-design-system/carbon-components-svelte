/**
 * Trap Tab/Shift+Tab focus within `container`, cycling focus across its
 * visible tabbable descendants. Always calls `event.preventDefault()`.
 */
export function trapFocus(options: {
  /** Element whose tabbable descendants form the focus loop. */
  container: Element;
  /** The Tab keydown event. */
  event: KeyboardEvent;
}): void;
