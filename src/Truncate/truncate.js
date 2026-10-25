// @ts-check
/**
 * Svelte action that truncates text on an element.
 * `lines` above 1 switches to multiline mode (end clamp only).
 * For `clamp: "front"`, wrap the content in `<bdi>` so a leading slash or a
 * trailing period stays in place.
 * @typedef {{ clamp?: "end" | "front"; lines?: number }} TruncateOptions
 * @param {HTMLElement} node
 * @param {TruncateOptions} [options]
 * @returns {{ update: (options?: TruncateOptions) => void }}
 * @example
 * <h1 use:truncate>...</h1>
 * <h1 use:truncate={{ clamp: "front" }}><bdi>...</bdi></h1>
 * <p use:truncate={{ lines: 3 }}>...</p>
 */
export function truncate(node, options = {}) {
  const prefix = "bx--text-truncate--";

  /** @param {TruncateOptions} [options] */
  function update(options = {}) {
    const lines = options.lines ?? 1;
    const multiline = lines > 1;

    const classes = [...node.classList]
      .filter((name) => !name.startsWith(prefix))
      .join(" ");

    let suffix;

    if (multiline) {
      suffix = "multiline";
      node.style.setProperty("--ccs-truncate-lines", String(lines));
    } else {
      suffix = options.clamp === "front" ? "front" : "end";
      node.style.removeProperty("--ccs-truncate-lines");
    }

    node.className = `${classes} ${prefix}${suffix}`;
  }

  update(options);

  return { update };
}
