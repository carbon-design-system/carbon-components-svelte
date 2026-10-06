// @ts-check
import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";
import {
  TOOLTIP_ENTER_DELAY_MS,
  TOOLTIP_SKIP_DELAY_MS,
} from "../constants/timing.js";

/**
 * @typedef {object} TooltipGroupScope
 * @property {number} releasedAt `Date.now()` of the last release by a
 *   tooltip in this scope, for the skip-delay window.
 */

/**
 * @typedef {object} TooltipGroup
 * @property {TooltipGroupScope} scope Tooltips hand off to each other only
 *   within the same scope. Nested groups share their parent's scope.
 * @property {() => number} enterDelayMs
 * @property {() => number | undefined} leaveDelayMs The leave delay set on
 *   this group or an enclosing one. `undefined` leaves the default to each
 *   tooltip: icon labels hide at once, hoverable tooltips linger.
 * @property {() => number} skipDelayMs
 */

/**
 * @typedef {object} TooltipToken
 * @property {TooltipGroupScope} scope
 */

const TOOLTIP_GROUP_CONTEXT_KEY = "carbon:TooltipGroup";

/**
 * The tooltip currently shown, page-wide. Only one tooltip shows at a time,
 * whatever its group. `null` means none is claimed.
 * @type {import("svelte/store").Writable<TooltipToken | null>}
 */
export const activeTooltip = writable(null);

/**
 * Group for tooltips outside any `TooltipGroup`, so standalone tooltips
 * still hand off to each other.
 * @type {TooltipGroup}
 */
export const rootTooltipGroup = {
  scope: { releasedAt: Number.NEGATIVE_INFINITY },
  enterDelayMs: () => TOOLTIP_ENTER_DELAY_MS,
  leaveDelayMs: () => undefined,
  skipDelayMs: () => TOOLTIP_SKIP_DELAY_MS,
};

/**
 * Create a tooltip group. A group nested in another (non-root) group joins
 * its scope; otherwise it starts a new one. Unset delays fall back to the
 * parent's.
 * @param {object} [options]
 * @param {TooltipGroup} [options.parent]
 * @param {() => number | undefined} [options.enterDelayMs]
 * @param {() => number | undefined} [options.leaveDelayMs]
 * @param {() => number | undefined} [options.skipDelayMs]
 * @returns {TooltipGroup}
 */
export function createTooltipGroup({
  parent = rootTooltipGroup,
  enterDelayMs,
  leaveDelayMs,
  skipDelayMs,
} = {}) {
  return {
    scope:
      parent === rootTooltipGroup
        ? { releasedAt: Number.NEGATIVE_INFINITY }
        : parent.scope,
    enterDelayMs: () => enterDelayMs?.() ?? parent.enterDelayMs(),
    leaveDelayMs: () => leaveDelayMs?.() ?? parent.leaveDelayMs(),
    skipDelayMs: () => skipDelayMs?.() ?? parent.skipDelayMs(),
  };
}

/**
 * Read the nearest tooltip group from context, or the root group.
 * Call during component initialization.
 * @returns {TooltipGroup}
 */
export function getTooltipGroup() {
  return getContext(TOOLTIP_GROUP_CONTEXT_KEY) ?? rootTooltipGroup;
}

/**
 * Create a tooltip group under the nearest one and provide it to
 * descendants. Call during component initialization.
 * @param {Omit<NonNullable<Parameters<typeof createTooltipGroup>[0]>, "parent">} [options]
 * @returns {TooltipGroup}
 */
export function provideTooltipGroup(options = {}) {
  const group = createTooltipGroup({ ...options, parent: getTooltipGroup() });
  setContext(TOOLTIP_GROUP_CONTEXT_KEY, group);
  return group;
}
