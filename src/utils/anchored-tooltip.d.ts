import type { Readable } from "svelte/store";
import type { TooltipGroup } from "./tooltip-group.js";

/**
 * Hover and focus state for a tooltip anchored to an element. The pointer
 * can move onto the tooltip. Escape, or activating the anchor, hides it
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
  /**
   * Let Escape go on after it hides the tooltip while this returns `true`,
   * focused or not.
   */
  passEscape?: () => boolean;
  /** Set to `false` to keep the tooltip open when the anchor is activated. */
  dismissOnClick?: boolean;
  /** Overrides the group's enter delay when it returns a number. */
  enterDelayMs?: () => number | undefined;
}): {
  /** `true` while the tooltip shows. */
  open: Readable<boolean>;
  /**
   * `true` while another tooltip is active, or the anchor has the pointer
   * or focus but the tooltip is closed. Holds back a tooltip that CSS shows
   * on hover and focus.
   */
  hidden: Readable<boolean>;
  /** `true` while the tooltip opened at once, without its fade-in. */
  instant: Readable<boolean>;
  /**
   * Listen for hover, focus and activation on `node`, and for Escape on
   * `window` while open; returns a remover.
   */
  attach: (node: HTMLElement) => () => void;
  /** Keep a portalled tooltip open while the pointer is on it. */
  handleTooltipMouseenter: () => void;
  /** Close a portalled tooltip after the leave delay. */
  handleTooltipMouseleave: () => void;
  /**
   * Hide on Escape and stop the key, unless `passEscape` returns `true`,
   * or `passEscapeWhenFocused` is set and the anchor has focus.
   */
  handleKeydown: (event: KeyboardEvent) => void;
  /** Hide until the next pointer enter or focus. */
  dismiss: () => void;
  /** Close at once and forget hover and focus. */
  hide: () => void;
  destroy: () => void;
};
