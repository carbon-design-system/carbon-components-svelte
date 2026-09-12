// @ts-check

/**
 * Svelte action: set `title` while text overflows horizontally.
 * `params.title` wins over auto-detection, including `""`.
 * `params.measure` checks a descendant instead of `node`.
 *
 * Measurement is deferred to a microtask. Svelte 3/4 run actions inline while
 * mounting each item, so measuring synchronously forces one layout per item in
 * a list (a 99-option menu paid for 100 layouts). Deferring lets every item
 * mount first, so the batch shares a single layout. An explicit `title` needs
 * no measurement and is applied synchronously.
 *
 * @param {HTMLElement} node Element that gets the `title` attribute.
 * @param {import("./overflow-title.js").OverflowTitleParams} [params]
 * @returns {{ update: (params?: import("./overflow-title.js").OverflowTitleParams) => void, destroy: () => void }}
 * @example
 * <div use:overflowTitle>{text}</div>
 * <label use:overflowTitle={{ title, measure: labelText }}>...</label>
 */
export function overflowTitle(node, params = {}) {
  /** @type {import("./overflow-title.js").OverflowTitleParams} */
  let latest = params;
  let scheduled = false;
  let destroyed = false;

  function measure() {
    scheduled = false;
    if (destroyed || latest.title != null) return;

    const measured = latest.measure ?? node;
    if (measured.offsetWidth < measured.scrollWidth) {
      // `textContent` reads the DOM text without forcing layout, unlike
      // `innerText`, which resolves rendered text and triggers a reflow.
      node.setAttribute("title", measured.textContent?.trim() ?? "");
    } else {
      node.removeAttribute("title");
    }
  }

  function update(next = {}) {
    latest = next;
    if (next.title != null) {
      node.setAttribute("title", next.title);
      return;
    }
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(measure);
  }

  update(params);

  return {
    update,
    destroy() {
      destroyed = true;
    },
  };
}

export default overflowTitle;
