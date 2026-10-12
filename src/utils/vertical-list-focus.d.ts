/**
 * Svelte action for a vertical menu or list: Up/Down wrap, Home/End jump to
 * the ends, and focus follows. Items are `selector` matches inside `node`.
 */
export function verticalListFocus(
  node: HTMLElement,
  options: {
    selector: string;
    /** Pass to skip matching items. */
    isDisabled?: (item: HTMLElement) => boolean;
  },
): { destroy: () => void };
