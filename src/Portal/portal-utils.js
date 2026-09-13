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
