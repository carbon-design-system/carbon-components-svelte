/**
 * `true` when the text in `node` overflows its box on the clamped axis:
 * sideways for a single line, downward when `multiline`.
 */
export function isTruncated(node: HTMLElement, multiline?: boolean): boolean;

/**
 * Call `callback` after the first layout, then whenever `node` resizes or
 * its text changes. Returns a function that stops observing.
 */
export function observeTruncation(
  node: HTMLElement,
  callback: () => void,
): () => void;
