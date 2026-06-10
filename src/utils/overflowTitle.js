// @ts-check

/**
 * Svelte action: set `title` while text overflows horizontally.
 * `params.title` wins over auto-detection, including `""`.
 * `params.measure` checks a descendant instead of `node`.
 *
 * @param {HTMLElement} node Element that gets the `title` attribute.
 * @param {import("./overflowTitle.js").OverflowTitleParams} [params]
 * @returns {{ update: (params?: import("./overflowTitle.js").OverflowTitleParams) => void }}
 * @example
 * <div use:overflowTitle>{text}</div>
 * <label use:overflowTitle={{ title, measure: labelText }}>...</label>
 */
export function overflowTitle(node, params = {}) {
  function update(next = {}) {
    if (next.title != null) {
      node.setAttribute("title", next.title);
      return;
    }

    const measured = next.measure ?? node;
    if (measured.offsetWidth < measured.scrollWidth) {
      node.setAttribute("title", measured.innerText);
    } else {
      node.removeAttribute("title");
    }
  }

  update(params);

  return { update };
}

export default overflowTitle;
