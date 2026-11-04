// @ts-check
/**
 * Observe the closest modal ancestor for close events.
 * Calls `onClose` when the modal loses the "is-visible" class.
 * Returns a cleanup function to disconnect the observer.
 * @param {HTMLElement} node
 * @param {() => void} onClose
 * @returns {() => void}
 */
export function observeModalClose(node, onClose) {
  const modal = node.closest(".bx--modal");
  if (!modal) return () => {};

  const observer = new MutationObserver(() => {
    if (!modal.classList.contains("is-visible")) {
      onClose();
    }
  });

  observer.observe(modal, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

/**
 * The fullscreen element, when it holds `anchor`. Only a fullscreen element's
 * subtree renders, so floating content portalled to `document.body` would be
 * hidden. `<html>` and `<body>` are not returned: `document.body` renders
 * inside them.
 * @param {Element | null | undefined} anchor
 * @returns {HTMLElement | null}
 */
export function getFullscreenRoot(anchor) {
  if (typeof document === "undefined" || !anchor) return null;
  const root = document.fullscreenElement;
  if (
    !(root instanceof HTMLElement) ||
    root === document.body ||
    root === document.documentElement ||
    !root.contains(anchor)
  ) {
    return null;
  }
  return root;
}
