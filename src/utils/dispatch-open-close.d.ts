/**
 * Create a tracker that dispatches "open" or "close" for the current `open`
 * on every call after the first, even when `open` repeats its previous
 * value. The first call (mount) is skipped.
 */
export function createOpenCloseDispatcher(
  dispatch: (name: "open" | "close") => void,
): (open: boolean) => void;
