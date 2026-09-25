// @ts-check

/**
 * Create a tracker that dispatches "open"/"close" whenever `open`
 * differs from its previous call, skipping the very first call (the
 * initial value isn't a "change" — it's the component mounting).
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
