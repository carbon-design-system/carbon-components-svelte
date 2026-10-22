/** `true` when the text in `node` overflows its box, so an ellipsis shows. */
export function isTruncated(node: HTMLElement): boolean;

/**
 * Report whether a tag label is truncated: once after its first layout,
 * then on every size change. Returns a function that stops observing.
 */
export function observeTruncation(
  node: HTMLElement,
  callback: (truncated: boolean) => void,
): () => void;
