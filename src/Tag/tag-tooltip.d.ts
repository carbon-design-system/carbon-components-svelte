import type { Readable } from "svelte/store";
import type { TooltipGroup } from "../utils/tooltip-group.js";

/**
 * Hover and focus state for a tooltip anchored to a tag, or to a tag's
 * close button. Activating the anchor or pressing Escape hides it until
 * the next pointer enter or focus.
 */
export function createTagTooltip(options?: {
  group?: TooltipGroup;
  /** Return `false` to ignore hover and focus. */
  enabled?: () => boolean;
}): {
  /** `true` while the tooltip shows. */
  open: Readable<boolean>;
  /** Listen for hover, focus and activation on `node`; returns a remover. */
  attach: (node: HTMLElement) => () => void;
  /**
   * Hide on Escape. Stops the key only when the tooltip opened by hover
   * alone; with the anchor focused, the key goes on to its handlers.
   */
  handleKeydown: (event: KeyboardEvent) => void;
  /** Hide until the next pointer enter or focus. */
  dismiss: () => void;
  /** Close at once and forget hover and focus. */
  hide: () => void;
  destroy: () => void;
};
