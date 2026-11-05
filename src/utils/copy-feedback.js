// @ts-check

import { COPY_FEEDBACK_FADE_MS } from "../constants/timing.js";

/** Default time (ms) copy feedback stays visible. */
export const COPY_FEEDBACK_TIMEOUT_MS = 2000;

/** @typedef {'fade-in' | 'fade-out' | undefined} CopyFeedbackAnimation */

/** Whether the user asked for less motion. False where `matchMedia` is missing. */
function prefersReducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Copy-button feedback (fade-in/out, portal tooltip).
 * After a successful copy, clicks are ignored until the feedback closes,
 * so a double click copies once and dispatches `copy` once. A click during
 * error feedback retries. A click while a copy is in flight is ignored.
 * The fade-out ends on the `animationend` of `hide-feedback`, or after
 * `COPY_FEEDBACK_FADE_MS` if that never fires (a hidden element, a
 * stylesheet without the animation). Under reduced motion there is no
 * fade-out: the feedback closes at once.
 * On copy failure, still opens feedback (`isError`) so callers can show
 * error text in the same tooltip slot, then rethrows.
 *
 * @param {() => void} [onSync] - Run after internal state changes (sync component `let`s).
 * @returns {{
 *   get animation(): CopyFeedbackAnimation,
 *   get feedbackOpen(): boolean,
 *   get copyPending(): boolean,
 *   get isError(): boolean,
 *   dismiss: () => void,
 *   onClick: (performCopy: () => void | Promise<void>, feedbackTimeout: number) => Promise<void>,
 *   onAnimationEnd: (event: { animationName: string }) => void,
 *   cleanup: () => void,
 * }}
 */
export function createCopyFeedbackState(onSync) {
  /** @type {CopyFeedbackAnimation} */
  let animation;
  let feedbackOpen = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;
  let copyActive = false;
  let copyPending = false;
  let copyFailed = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let fadeTimeout;
  // Bumped by `cleanup` so a copy still in flight when feedback is dismissed
  // (e.g. the Modal closes) doesn't reopen it on resolve.
  let epoch = 0;

  function notify() {
    onSync?.();
  }

  /** Close the feedback and allow another copy. */
  function finish() {
    clearTimeout(timeout);
    timeout = undefined;
    clearTimeout(fadeTimeout);
    fadeTimeout = undefined;
    animation = undefined;
    feedbackOpen = false;
    copyActive = false;
    copyFailed = false;
    notify();
  }

  function startFadeOut() {
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    animation = "fade-out";
    // `animationend` does not fire for an element that is hidden or has no
    // animation, which would leave the feedback open and copying blocked.
    fadeTimeout = setTimeout(finish, COPY_FEEDBACK_FADE_MS + 50);
    notify();
  }

  /**
   * @param {number} feedbackTimeout
   * @param {boolean} error
   */
  function openFeedback(feedbackTimeout, error) {
    copyPending = false;
    copyFailed = error;
    animation = "fade-in";
    feedbackOpen = true;
    clearTimeout(timeout);
    clearTimeout(fadeTimeout);
    timeout = setTimeout(startFadeOut, feedbackTimeout);
    notify();
  }

  function cleanup() {
    epoch++;
    feedbackOpen = false;
    animation = undefined;
    copyActive = false;
    copyPending = false;
    copyFailed = false;
    clearTimeout(timeout);
    timeout = undefined;
    clearTimeout(fadeTimeout);
    fadeTimeout = undefined;
  }

  function dismiss() {
    cleanup();
    notify();
  }

  /**
   * @param {() => void | Promise<void>} performCopy
   * @param {number} feedbackTimeout
   * @returns {Promise<void>}
   */
  async function handleClick(performCopy, feedbackTimeout) {
    if (copyPending || (copyActive && !copyFailed)) return;

    copyActive = true;
    copyPending = true;
    // A retry keeps the error feedback open until the new copy settles,
    // then `openFeedback` restarts the timeout.
    clearTimeout(timeout);
    clearTimeout(fadeTimeout);
    notify();

    const startEpoch = epoch;

    try {
      await performCopy();
    } catch (error) {
      if (epoch === startEpoch) openFeedback(feedbackTimeout, true);
      throw error;
    }

    if (epoch === startEpoch) openFeedback(feedbackTimeout, false);
  }

  /** @param {{ animationName: string }} event */
  function handleAnimationend(event) {
    if (event.animationName === "hide-feedback") finish();
  }

  return {
    get animation() {
      return animation;
    },
    get feedbackOpen() {
      return feedbackOpen;
    },
    get copyPending() {
      return copyPending;
    },
    get isError() {
      return copyFailed;
    },
    dismiss,
    onClick: handleClick,
    onAnimationEnd: handleAnimationend,
    cleanup,
  };
}
