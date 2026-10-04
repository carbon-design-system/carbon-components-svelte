/**
 * Keeps a select-on-focus selection after a click in WebKit, where mouseup
 * would otherwise collapse it. Does not select anything itself.
 */
export function preserveFocusSelection(
  node: HTMLInputElement | HTMLTextAreaElement,
  enabled: boolean,
): { update: (enabled: boolean) => void; destroy: () => void };
