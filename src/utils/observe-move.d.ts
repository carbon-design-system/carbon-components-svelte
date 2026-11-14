/**
 * Call `onMove` when `element` moves in the viewport without a scroll or a
 * resize; returns a stop function. Does nothing without `IntersectionObserver`.
 */
export function observeMove(element: Element, onMove: () => void): () => void;
