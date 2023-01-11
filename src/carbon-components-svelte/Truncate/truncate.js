/**
 * Svelte action that applies single-line text truncation to an element
 * @typedef {{ clamp?: "end" | "front" }} TruncateOptions
 * @type {(node: HTMLElement, options?: TruncateOptions) => { update: (options?: TruncateOptions) => void; }}
 * @example
 * <h1 use:truncate>...</h1>
 * <h1 use:truncate={{ clamp: "front" }}>...</h1>
 */
export function truncate(node, options = {}) {
  const prefix = "bx--text-truncate--";

  function toggleClass(front = false) {
    const classes = [...node.classList]
      .filter((name) => !name.startsWith(prefix))
      .join(" ");

    node.className = `${classes} ${prefix}${front ? "front" : "end"}`;
  }

  toggleClass(options.clamp === "front");

  return {
    update(options) {
      toggleClass(options.clamp === "front");
    },
  };
}

export default truncate;
