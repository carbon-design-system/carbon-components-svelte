// @ts-check

/**
 * Create a tracker that dispatches "open" or "close" for the current `open`
 * on every call after the first, even when `open` repeats its previous
 * value. The first call is skipped: the initial value isn't a change, it's
 * the component mounting. Callers run it from a `$:` block that depends
 * only on `open`, so it runs once per change.
 * @param {(name: "open" | "close") => void} dispatch
 * @returns {(open: boolean) => void}
 */
export function createOpenCloseDispatcher(dispatch) {
  /** @type {boolean | undefined} */
  let prevOpen;

  return (open) => {
    const shouldDispatch = prevOpen !== undefined;
    prevOpen = open;
    if (shouldDispatch) {
      dispatch(open ? "open" : "close");
    }
  };
}
