// @ts-check
import { derived, get, writable } from "svelte/store";
import {
  TOOLTIP_ICON_LEAVE_DELAY_MS,
  TOOLTIP_LEAVE_DELAY_MS,
} from "../constants/timing.js";
import { createDelayedSetter } from "./delayed-setter.js";
import { activeTooltip, rootTooltipGroup } from "./tooltip-group.js";

/**
 * Hover and focus scheduling for a tooltip in a tooltip group. Only one
 * tooltip shows at a time page-wide. Entering while another tooltip in the
 * same group is shown, or within the group's skip window after one closed,
 * skips the enter delay (warm handoff) and marks the open as `instant` so
 * inline tooltips can drop their fade-in.
 *
 * The component keeps its own `hovered`/`focused` state; this schedules
 * the delayed callbacks and the claim/release calls.
 *
 * @param {object} [options]
 * @param {import("./tooltip-group.js").TooltipGroup} [options.group]
 * @param {() => number | undefined} [options.enterDelayMs] Overrides the
 *   group's enter delay when it returns a number.
 * @param {() => number | undefined} [options.leaveDelayMs] Overrides the
 *   group's leave delay when it returns a number.
 * @param {boolean} [options.rich] Set for `Tooltip` and
 *   `TooltipDefinition`. Without a leave delay from the group or the
 *   tooltip, they wait `TOOLTIP_LEAVE_DELAY_MS` before they close, and icon
 *   tooltips `TOOLTIP_ICON_LEAVE_DELAY_MS`. Either way the pointer can
 *   move onto the tooltip (WCAG 1.4.13). A neighbor in the group still
 *   takes over at once, so the wait doesn't slow the handoff.
 */
export function createTooltipHandoff({
  group = rootTooltipGroup,
  enterDelayMs,
  leaveDelayMs,
  rich = false,
} = {}) {
  const scheduleTooltip = createDelayedSetter();
  /** @type {import("./tooltip-group.js").TooltipToken} */
  const token = { scope: group.scope };
  const claimedWarm = writable(false);

  /** `true` while this tooltip holds the active slot. */
  const active = derived(activeTooltip, ($active) => $active === token);

  /** `true` while another tooltip holds the active slot. */
  const hidden = derived(
    activeTooltip,
    ($active) => $active !== null && $active !== token,
  );

  /** `true` while this tooltip holds the slot it took by warm handoff. */
  const instant = derived(
    [active, claimedWarm],
    ([$active, $claimedWarm]) => $active && $claimedWarm,
  );

  function isWarm() {
    const current = get(activeTooltip);
    if (current !== null) {
      return current !== token && current.scope === group.scope;
    }
    return Date.now() - group.scope.releasedAt < group.skipDelayMs();
  }

  /**
   * Claim the active slot for this tooltip. A no-op on the server, where
   * the slot is module state shared across requests and nothing would
   * release it.
   * @param {object} [options]
   * @param {boolean} [options.instant] Mark the open as `instant` even
   *   without a warm handoff, e.g. on keyboard focus.
   */
  function claim({ instant = false } = {}) {
    if (typeof window === "undefined") return;
    if (get(activeTooltip) === token) return;
    claimedWarm.set(instant || isWarm());
    activeTooltip.set(token);
  }

  /** Clear the active slot if this tooltip holds it. */
  function release() {
    if (get(activeTooltip) !== token) return;
    group.scope.releasedAt = Date.now();
    activeTooltip.set(null);
  }

  /**
   * Hide on the user's request (Escape). Cancel any pending enter or leave,
   * clear the slot, and end the group's skip window. The user asked for
   * the tooltip to go, so the next one in the group waits out its enter
   * delay and fades in, rather than popping up at once.
   */
  function dismiss() {
    scheduleTooltip.cancel();
    if (get(activeTooltip) !== token) return;
    group.scope.releasedAt = Number.NEGATIVE_INFINITY;
    activeTooltip.set(null);
  }

  /**
   * Call `onShow` and claim the slot after the enter delay, or right away
   * on a warm handoff. It replaces a pending leave, so a tooltip the
   * pointer comes back to stays open.
   * @param {() => void} onShow
   */
  function scheduleEnter(onShow) {
    const delay = isWarm() ? 0 : (enterDelayMs?.() ?? group.enterDelayMs());
    scheduleTooltip(delay, () => {
      onShow();
      claim();
    });
  }

  /**
   * Call `onHide` after the leave delay.
   * @param {() => void} onHide
   */
  function scheduleLeave(onHide) {
    scheduleTooltip(
      leaveDelayMs?.() ??
        group.leaveDelayMs() ??
        (rich ? TOOLTIP_LEAVE_DELAY_MS : TOOLTIP_ICON_LEAVE_DELAY_MS),
      onHide,
    );
  }

  return {
    active,
    hidden,
    instant,
    scheduleEnter,
    scheduleLeave,
    claim,
    release,
    dismiss,
    cancel: scheduleTooltip.cancel,
  };
}
