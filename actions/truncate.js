/**
 * Svelte action that applies single-line text truncation to an element
 * @param {HTMLElement} node
 * @param {{ clamp?: "end" | "front" }} params
 * @example
 * <script>
 *   import { truncate } from "carbon-components-svelte/actions";
 * </script>
 *
 * <h1 use:truncate>...</h1>
 * <h1 use:truncate={{ clamp: "front" }}>...</h1>
 */
export function truncate(node, params = {}) {
  function toggleClass(front = false) {
    node.className = `bx--text-truncate--${front ? "front" : "end"}`;
  }

  toggleClass(params.clamp === "front");

  return {
    update(params) {
      toggleClass(params.clamp === "front");
    },
  };
}
