import type { Readable } from "svelte/store";
import type { TooltipGroup } from "./tooltip-group.js";

/**
 * Hover and focus state for a tooltip anchored to an element that has no
 * tooltip of its own. Activating the anchor or pressing Escape hides it
 * until the next pointer enter or focus.
 */
export function createAnchoredTooltip(options?: {
  group?: TooltipGroup;
  /** Return `false` to ignore hover and focus. */
  enabled?: () => boolean;
  /**
   * Let Escape reach the focused anchor's own handlers after it hides the
   * tooltip.
   */
  passEscapeWhenFocused?: boolean;
}): {
  /** `true` while the tooltip shows. */
  open: Readable<boolean>;
  /** Listen for hover, focus and activation on `node`; returns a remover. */
  attach: (node: HTMLElement) => () => void;
  /**
   * Hide on Escape and stop the key, unless `passEscapeWhenFocused` is set
   * and the anchor has focus.
   */
  handleKeydown: (event: KeyboardEvent) => void;
  /** Hide until the next pointer enter or focus. */
  dismiss: () => void;
  /** Close at once and forget hover and focus. */
  hide: () => void;
  destroy: () => void;
};
