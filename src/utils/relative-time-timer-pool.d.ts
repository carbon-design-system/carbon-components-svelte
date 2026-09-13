/**
 * Subscribe `callback` to the shared interval for `refreshMs`.
 * The first subscriber starts `setInterval`; the last clears it.
 */
export function subscribeRelativeTimeTick(
  refreshMs: number,
  callback: () => void,
): () => void;
