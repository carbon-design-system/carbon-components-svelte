/**
 * Observe the closest modal ancestor for close events.
 * Calls `onClose` when the modal loses the "is-visible" class.
 * Returns a cleanup function to disconnect the observer.
 */
export declare function observeModalClose(
  node: HTMLElement,
  onClose: () => void,
): () => void;

/**
 * The fullscreen element, when it holds `anchor`. Only a fullscreen element's
 * subtree renders, so floating content portalled to `document.body` would be
 * hidden. The root element is not returned: `document.body` renders inside it.
 */
export declare function getFullscreenRoot(
  anchor: Element | null | undefined,
): HTMLElement | null;
