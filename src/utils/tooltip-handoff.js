// @ts-check
import { get } from "svelte/store";
import {
  TOOLTIP_ENTER_DELAY_MS,
  TOOLTIP_LEAVE_DELAY_MS,
} from "../constants/timing.js";
import { createDelayedSetter } from "./delayed-setter.js";

/**
 * Create hover/focus scheduling for an icon tooltip that coordinates with
 * sibling tooltips through a shared "active tooltip" store (a plain Svelte
 * writable whose value is whichever tooltip's id/token currently "owns"
 * it): claiming the store lets other tooltips using it close immediately,
 * and entering a tooltip while another is already active skips the enter
 * delay ("warm handoff") so moving between adjacent triggers feels
 * instant. The store itself is owned by the caller — a module-level store
 * for a page-wide group (e.g. `Button`/`CopyButton`'s icon-only tooltips),
 * or a per-parent store handed down via context (e.g. one `Tabs` row's
 * icon-only tab tooltips).
 *
 * The component keeps owning its own reactive `hovered`/`focused` state (so
 * it can drive a `$:` open condition); this only schedules the delayed
 * callbacks and the claim/release calls against the shared store.
 * @param {object} options
 * @param {import("svelte/store").Writable<*>} options.activeTooltip - Store
 *   holding the id of whichever tooltip using it may currently show.
 * @param {*} options.id - This tooltip's identity within `activeTooltip`.
 * @param {number} [options.enterDelayMs]
 * @param {number} [options.leaveDelayMs]
 * @param {*} [options.emptyValue] - Value written to `activeTooltip` on
 *   release, and treated as "nothing claimed" for warm-handoff detection.
 *   Defaults to `null`; must match the value the store was created with.
 *   Pass `emptyValue: undefined` explicitly for a store whose sentinel is
 *   `undefined` — unlike a plain destructuring default, an explicit
 *   `undefined` here is honored rather than falling back to `null`.
 * @returns {{
 *   scheduleEnter: (onShow: () => void) => void,
 *   scheduleLeave: (onHide: () => void) => void,
 *   claim: () => void,
 *   release: () => void,
 *   cancel: () => void,
 * }}
 */
export function createTooltipHandoff(options) {
  const {
    activeTooltip,
    id,
    enterDelayMs = TOOLTIP_ENTER_DELAY_MS,
    leaveDelayMs = TOOLTIP_LEAVE_DELAY_MS,
  } = options;
  // A destructuring default (`emptyValue = null`) can't be overridden by an
  // explicit `emptyValue: undefined`, since JS applies the default whenever
  // the value is `undefined` regardless of whether the key was passed. Read
  // it via `in` instead so callers that want `undefined` as their sentinel
  // (matching a pre-existing store) can actually get it.
  const emptyValue = "emptyValue" in options ? options.emptyValue : null;
  const scheduleTooltip = createDelayedSetter();

  /** Claim the store for this tooltip, unconditionally. */
  function claim() {
    activeTooltip.set(id);
  }

  /** Clear the store, but only if this tooltip still holds it. */
  function release() {
    if (get(activeTooltip) === id) {
      activeTooltip.set(emptyValue);
    }
  }

  /**
   * Schedule showing the tooltip: after `enterDelayMs`, or immediately
   * (0ms) when another tooltip already holds the store (warm handoff).
   * Calls `onShow`, then claims the store, once the delay elapses.
   * @param {() => void} onShow
   */
  function scheduleEnter(onShow) {
    const current = get(activeTooltip);
    const warmHandoff = current !== emptyValue && current !== id;
    scheduleTooltip(warmHandoff ? 0 : enterDelayMs, () => {
      onShow();
      claim();
    });
  }

  /**
   * Schedule hiding the tooltip after `leaveDelayMs`. Callers typically
   * clear their own `hovered` flag and conditionally call `release()`
   * (skipping it while still focused) from within `onHide`.
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
