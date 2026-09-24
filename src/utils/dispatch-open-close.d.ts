/** Create a tracker that dispatches "open"/"close" on change, skipping mount. */
export function createOpenCloseDispatcher(
  dispatch: (name: "open" | "close") => void,
): (open: boolean) => void;
