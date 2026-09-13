/**
 * Walk up from `node` and return ancestors with `overflow` auto/scroll on any axis.
 * Nearest first. Does not include `node`.
 */
export function getScrollableAncestors(
  node: HTMLElement,
): Array<HTMLElement | Document>;
