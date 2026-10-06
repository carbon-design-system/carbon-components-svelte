import type { Readable } from "svelte/store";
import type { TooltipGroup } from "./tooltip-group.js";

/**
 * Hover and focus scheduling for a tooltip in a tooltip group. Only one
 * tooltip shows at a time page-wide. Entering while another tooltip in the
 * same group is shown, or within the group's skip window after one closed,
 * skips the enter delay (warm handoff) and marks the open as `instant`.
 */
export function createTooltipHandoff(options?: {
  group?: TooltipGroup;
  /** Overrides the group's enter delay when it returns a number. */
  enterDelayMs?: () => number | undefined;
  /** Overrides the group's leave delay when it returns a number. */
  leaveDelayMs?: () => number | undefined;
  /**
   * Set for a tooltip the pointer can move onto. Without a leave delay
   * from the group or the tooltip, a hoverable tooltip lingers for
   * `TOOLTIP_LEAVE_DELAY_MS`; an icon label hides at once.
   */
  hoverable?: boolean;
}): {
  /** `true` while this tooltip holds the active slot. */
  active: Readable<boolean>;
  /** `true` while another tooltip holds the active slot. */
  hidden: Readable<boolean>;
  /** `true` while this tooltip holds the slot it took by warm handoff. */
  instant: Readable<boolean>;
  scheduleEnter: (onShow: () => void) => void;
  scheduleLeave: (onHide: () => void) => void;
  /**
   * Claim the active slot. `instant` marks the open as instant even
   * without a warm handoff, e.g. on keyboard focus.
   */
  claim: (options?: { instant?: boolean }) => void;
  release: () => void;
  cancel: () => void;
};
