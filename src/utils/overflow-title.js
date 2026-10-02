// @ts-check

/**
 * @typedef {import("./overflow-title.js").OverflowTitleParams} Params
 */

/**
 * Svelte action: set `title` while text overflows horizontally.
 * `options.title` wins over auto-detection, including `""`.
 * `options.measure` checks a descendant instead of `node`.
 *
 * Measurement is deferred to a microtask. Svelte 3/4 run actions inline while
 * mounting each item, so measuring synchronously forces one layout per item in
 * a list (a 99-option menu paid for 100 layouts). Deferring lets every item
 * mount first, so the batch shares a single layout. An explicit `title` needs
 * no measurement and is applied synchronously.
 *
 * @param {HTMLElement} node Element that gets the `title` attribute.
 * @param {import("./overflow-title.js").OverflowTitleParams} [options]
 * @returns {{ update: (options?: import("./overflow-title.js").OverflowTitleParams) => void, destroy: () => void }}
 * @example
 * <div use:overflowTitle>{text}</div>
 * <label use:overflowTitle={{ title, measure: labelText }}>...</label>
 */
export function overflowTitle(node, options = {}) {
  /** @type {import("./overflow-title.js").OverflowTitleParams} */
  let latest = options;
  let scheduled = false;
  let destroyed = false;
  let listening = false;

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

  // Hovering or focusing can start a width transition on an ancestor (a
  // rail `SideNav` widens on `:hover`), so the measurement on entry reads
  // the narrow layout. Measure again once that transition ends.
  /** @param {TransitionEvent} event */
  function handleTransitionend(event) {
    if (
      event.propertyName === "width" &&
      event.target instanceof Node &&
      event.target.contains(node)
    ) {
      measure();
    }
  }

  function handleEnter() {
    measure();
    node.ownerDocument.addEventListener("transitionend", handleTransitionend);
  }

  function handleLeave() {
    node.ownerDocument.removeEventListener(
      "transitionend",
      handleTransitionend,
    );
  }

  function addLazyListeners() {
    if (listening) return;
    listening = true;
    node.addEventListener("pointerenter", handleEnter);
    node.addEventListener("focusin", handleEnter);
    node.addEventListener("pointerleave", handleLeave);
    node.addEventListener("focusout", handleLeave);
  }

  function removeLazyListeners() {
    if (!listening) return;
    listening = false;
    node.removeEventListener("pointerenter", handleEnter);
    node.removeEventListener("focusin", handleEnter);
    node.removeEventListener("pointerleave", handleLeave);
    node.removeEventListener("focusout", handleLeave);
    handleLeave();
  }

  /** @param {Params} [next] */
  function update(next = {}) {
    latest = next;
    if (next.lazy) {
      addLazyListeners();
    } else {
      removeLazyListeners();
    }
    if (next.title != null) {
      node.setAttribute("title", next.title);
      return;
    }
    // Lazy mode measures from `pointerenter`/`focusin` instead, since the
    // side nav's width can still change after mount (resize, rail hover).
    if (next.lazy) return;
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(measure);
  }

  update(options);

  return {
    update,
    destroy() {
      destroyed = true;
      removeLazyListeners();
    },
  };
}
