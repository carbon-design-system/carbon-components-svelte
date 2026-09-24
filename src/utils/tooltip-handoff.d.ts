import type { Writable } from "svelte/store";

/**
 * Hover and focus scheduling for icon tooltips that share an "active
 * tooltip" store, so only one tooltip in the group shows at a time.
 * Entering while another tooltip holds the store skips the enter delay
 * (warm handoff). `null` in the store means nothing is claimed.
 */
export function createTooltipHandoff(options: {
  activeTooltip: Writable<unknown>;
  /** Identity of this tooltip in the store. */
  getId: () => unknown;
  enterDelayMs?: number;
  leaveDelayMs?: number;
}): {
  scheduleEnter: (onShow: () => void) => void;
  scheduleLeave: (onHide: () => void) => void;
  claim: () => void;
  release: () => void;
  cancel: () => void;
};
