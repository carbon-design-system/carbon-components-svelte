/**
 * Pick the item to focus when an arrow key opens or enters a menu: the
 * first item for `"ArrowDown"`, the last for `"ArrowUp"`.
 */
export function pickEdgeMenuItem<T>(
  key: "ArrowDown" | "ArrowUp",
  items: ReadonlyArray<T>,
): T | undefined;
