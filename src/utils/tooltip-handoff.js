// @ts-check
import { get } from "svelte/store";
import {
  TOOLTIP_ENTER_DELAY_MS,
  TOOLTIP_LEAVE_DELAY_MS,
} from "../constants/timing.js";
import { createDelayedSetter } from "./delayed-setter.js";

/**
 * Hover and focus scheduling for icon tooltips that share an "active
 * tooltip" store, so only one tooltip in the group shows at a time.
 * Entering while another tooltip holds the store skips the enter delay
 * (warm handoff). `null` in the store means nothing is claimed.
 *
 * The component keeps its own `hovered`/`focused` state; this schedules
 * the delayed callbacks and the claim/release calls.
 *
 * @param {object} options
 * @param {import("svelte/store").Writable<*>} options.activeTooltip
 * @param {() => *} options.getId Identity of this tooltip in the store.
 *   A getter so a changed `id` prop is picked up.
 * @param {number} [options.enterDelayMs]
 * @param {number} [options.leaveDelayMs]
 */
export function createTooltipHandoff({
  activeTooltip,
  getId,
  enterDelayMs = TOOLTIP_ENTER_DELAY_MS,
  leaveDelayMs = TOOLTIP_LEAVE_DELAY_MS,
}) {
  const scheduleTooltip = createDelayedSetter();

  /** Claim the store for this tooltip. */
  function claim() {
    activeTooltip.set(getId());
  }

  /** Clear the store if this tooltip holds it. */
  function release() {
    if (get(activeTooltip) === getId()) activeTooltip.set(null);
  }

  /**
   * Call `onShow` and claim the store after the enter delay, or right
   * away when another tooltip holds the store.
   * @param {() => void} onShow
   */
  function scheduleEnter(onShow) {
    const current = get(activeTooltip);
    const warmHandoff = current !== null && current !== getId();
    scheduleTooltip(warmHandoff ? 0 : enterDelayMs, () => {
      onShow();
      claim();
    });
  }

  /**
   * Call `onHide` after the leave delay.
   * @param {() => void} onHide
   */
  function scheduleLeave(onHide) {
    scheduleTooltip(leaveDelayMs, onHide);
  }

  return {
    scheduleEnter,
    scheduleLeave,
    claim,
    release,
    cancel: scheduleTooltip.cancel,
  };
}
