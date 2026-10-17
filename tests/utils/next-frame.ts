/** Waits for the next animation frame, letting rAF-deferred work run. */
export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
