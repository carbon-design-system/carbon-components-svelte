import { screen } from "@testing-library/svelte";
import { user } from "../utils/user";

/**
 * Parses the JSON blob a ContextMenu test fixture renders into a
 * `data-testid="selected-ids"` element to report its bound selection.
 */
export function getSelectedIds() {
  return JSON.parse(screen.getByTestId("selected-ids").textContent || "[]");
}

/** Right-clicks `target` at (100, 100), as a pointer press that opens a ContextMenu. */
export function rightClick(target: Element) {
  return user.pointer({
    target,
    coords: { x: 100, y: 100 },
    keys: "[MouseRight]",
  });
}
