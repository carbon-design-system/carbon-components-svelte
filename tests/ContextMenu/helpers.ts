import { screen } from "@testing-library/svelte";

/**
 * Parses the JSON blob a ContextMenu test fixture renders into a
 * `data-testid="selected-ids"` element to report its bound selection.
 */
export function getSelectedIds() {
  return JSON.parse(screen.getByTestId("selected-ids").textContent || "[]");
}
