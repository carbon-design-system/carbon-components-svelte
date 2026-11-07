/**
 * Queue `mount` for when the browser is idle, after what was queued
 * before, unless `element` is above the viewport by then. Returns a
 * function that takes it off the queue.
 */
export function queueIdleMount(element: Element, mount: () => void): () => void;
