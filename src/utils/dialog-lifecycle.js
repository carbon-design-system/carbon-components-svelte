// @ts-check
import { tick } from "svelte";
import { createOutsideDismiss } from "./outside-dismiss.js";

/**
 * Shared open/close lifecycle for `Modal` and `ComposedModal`: the
 * cancelable `close(trigger)` dispatch, outside-click dismiss wiring, and
 * the prevOpen/closeDispatched/mounted state machine that dispatches
 * "open"/"close" on external `open` changes and re-focuses the dialog on
 * later (post-mount) open transitions.
 *
 * Each component still owns, and calls into this factory's return value
 * from, its own:
 * - `setContext(MODAL_CONTEXT_KEY, {})` (and any component-specific
 *   context, e.g. ComposedModal's `"carbon:ComposedModal"`).
 * - The `sharedOpen`/`trackModal` registration (`const sharedOpen =
 *   writable(open); $: $sharedOpen = open; trackModal(sharedOpen);`).
 *   `trackModal` calls Svelte's `onMount` internally, which must run
 *   during real component initialization — bundling it into this factory
 *   would make the factory untestable outside a mounted component for a
 *   3-line saving, so it stays inline in each component.
 * - `onMount`: call `setMounted()`, then this component's own *initial*
 *   focus — Modal focuses synchronously there ("DOM is already in place —
 *   no `tick()` needed"), ComposedModal wraps it in `tick()`. That drift
 *   is deliberate (flagged, not unified) and stays in each component.
 * - `$: syncOpen(open);` — Svelte reactive statements can't live inside a
 *   plain factory function; call the returned `syncOpen` from one.
 *
 * @param {object} options
 * @param {(
 *   name: string,
 *   detail?: object,
 *   opts?: object,
 * ) => boolean} options.dispatch
 * @param {(open: boolean) => void} options.setOpen
 * @param {() => boolean | undefined} options.preventCloseOnClickOutside
 * @param {() => boolean} options.passive - Whether the dialog has no
 *   actions. See `closesOnOutsideClick`.
 * @param {() => void} options.saveFocusReturn - Capture
 *   `document.activeElement` before this dialog's own DOM can steal
 *   focus; called synchronously, before "open" is dispatched.
 * @param {() => void} options.focus - Re-focus the dialog on a later
 *   (post-mount) open transition. Always deferred with `tick()` here.
 * @param {() => void} options.restoreFocusReturn - Restore the focus
 *   saved by `saveFocusReturn`. Each component calls it on the closing
 *   transform `transitionend`. This factory also calls it after close,
 *   once the container's transition time has passed, in case that event
 *   never fires. A second call must do nothing.
 * @param {() => Element | null} options.getContainer - The element whose
 *   transform transition ends the close animation.
 * @param {() => boolean} options.getOpen - Re-read the current `open`
 *   prop value inside the deferred `tick()` callback, which needs the
 *   *live* value (the dialog may have closed again before the tick
 *   resolves), not a snapshot from when `syncOpen` was called.
 * @returns {{
 *   close: (trigger: string) => void,
 *   outsideDismiss: ReturnType<typeof createOutsideDismiss>,
 *   setMounted: () => void,
 *   syncOpen: (open: boolean) => void,
 * }}
 */
export function createDialogLifecycle({
  dispatch,
  setOpen,
  preventCloseOnClickOutside,
  passive,
  saveFocusReturn,
  focus,
  restoreFocusReturn,
  getContainer,
  getOpen,
}) {
  let closeDispatched = false;
  let prevOpen = false;
  let mounted = false;
  /** @type {undefined | ReturnType<typeof setTimeout>} */
  let restoreTimer;

  /** @param {string} trigger */
  function close(trigger) {
    closeDispatched = true;
    const shouldContinue = dispatch("close", { trigger }, { cancelable: true });
    if (shouldContinue) {
      setOpen(false);
    } else {
      closeDispatched = false;
    }
  }

  const outsideDismiss = createOutsideDismiss(() => {
    if (closesOnOutsideClick(preventCloseOnClickOutside(), passive())) {
      close("outside-click");
    }
  });

  function setMounted() {
    mounted = true;
  }

  /** @param {boolean} nextOpen */
  function syncOpen(nextOpen) {
    if (prevOpen) {
      if (!nextOpen) {
        prevOpen = false;
        if (!closeDispatched) {
          tick().then(() => {
            dispatch("close", { trigger: "programmatic" });
          });
        }
        closeDispatched = false;
        // `transitionend` restores focus when the closing transition ends.
        // It never fires when the transition does not run: a transition
        // disabled with `transition: none`, a transform a consumer pins,
        // or a hidden container. Restore after the transition's length
        // in any case; a second restore does nothing.
        tick().then(() => {
          if (getOpen()) return;
          const ms = transitionMs(getContainer());
          if (ms === 0) {
            restoreFocusReturn();
          } else {
            restoreTimer = setTimeout(() => {
              if (!getOpen()) restoreFocusReturn();
            }, ms);
          }
        });
      }
    } else if (nextOpen) {
      prevOpen = true;
      clearTimeout(restoreTimer);
      // Reading `document.activeElement` doesn't depend on this dialog's
      // own DOM, so it's safe (and race-free) to capture it synchronously.
      saveFocusReturn();
      dispatch("open");
      // Skip on the initial-mount run: the caller's own `onMount` already
      // handles focusing an already-open dialog. This only covers later
      // open transitions, where `focus()` needs the committed DOM.
      if (mounted) {
        tick().then(() => {
          if (getOpen()) focus();
        });
      }
    }
  }

  return { close, outsideDismiss, setMounted, syncOpen };
}

/**
 * Carbon v11's outside-click rule. A passive dialog (no actions) closes
 * unless `preventCloseOnClickOutside` is `true`. A transactional dialog
 * stays open unless it is explicitly `false`.
 * @param {boolean | undefined} preventCloseOnClickOutside
 * @param {boolean} passive
 * @returns {boolean}
 */
export function closesOnOutsideClick(preventCloseOnClickOutside, passive) {
  return passive
    ? !preventCloseOnClickOutside
    : preventCloseOnClickOutside === false;
}

/**
 * The time in ms until the longest transition on `element` ends, delay
 * included. 0 when it has none.
 * @param {Element | null} element
 * @returns {number}
 */
function transitionMs(element) {
  if (!element) return 0;
  const { transitionDuration, transitionDelay } = getComputedStyle(element);
  const delays = (transitionDelay || "0s").split(",").map(toMs);
  return transitionDuration
    .split(",")
    .map(toMs)
    .reduce((longest, duration, i) => {
      if (duration <= 0) return longest;
      return Math.max(longest, duration + delays[i % delays.length]);
    }, 0);
}

/**
 * @param {string} time - A CSS time, such as `0.24s` or `240ms`.
 * @returns {number}
 */
function toMs(time) {
  const value = Number.parseFloat(time) || 0;
  return time.trim().endsWith("ms") ? value : value * 1000;
}
