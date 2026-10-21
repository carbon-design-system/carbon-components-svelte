// @ts-check

/** Default time (ms) copy feedback stays visible. */
export const COPY_FEEDBACK_TIMEOUT_MS = 2000;

/** @typedef {'fade-in' | 'fade-out' | undefined} CopyFeedbackAnimation */

/**
 * Copy-button feedback (fade-in/out, portal tooltip).
 * `copyActive` blocks a second click before Svelte assigns `animation`.
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
 *   onClick: (performCopy: () => void | Promise<void>, feedbackTimeout: number, portalled?: boolean) => Promise<void>,
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
  // Bumped by `cleanup` so a copy still in flight when feedback is dismissed
  // (e.g. the Modal closes) doesn't reopen it on resolve.
  let epoch = 0;

  function notify() {
    onSync?.();
  }

  /**
   * @param {number} feedbackTimeout
   * @param {boolean} portalled
   * @param {boolean} error
   */
  function openFeedback(feedbackTimeout, portalled, error) {
    copyPending = false;
    copyFailed = error;
    animation = "fade-in";
    feedbackOpen = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (portalled) {
        feedbackOpen = false;
        animation = undefined;
        copyActive = false;
        copyFailed = false;
      } else {
        animation = "fade-out";
      }
      notify();
    }, feedbackTimeout);
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
  }

  function dismiss() {
    cleanup();
    notify();
  }

  /**
   * @param {() => void | Promise<void>} performCopy
   * @param {number} feedbackTimeout
   * @param {boolean} [portalled] - When `true`, close feedback directly on
   *   timeout instead of awaiting the `hide-feedback` animation. The portalled
   *   tooltip hides the feedback element, so that animation (and its
   *   `animationend`) never fires and the tooltip would otherwise stay open.
   * @returns {Promise<void>}
   */
  async function handleClick(performCopy, feedbackTimeout, portalled = false) {
    if (copyActive || animation === "fade-in") return;

    copyActive = true;
    copyPending = true;
    copyFailed = false;
    notify();

    const startEpoch = epoch;

    try {
      await performCopy();
    } catch (error) {
      if (epoch === startEpoch) openFeedback(feedbackTimeout, portalled, true);
      throw error;
    }

    if (epoch === startEpoch) openFeedback(feedbackTimeout, portalled, false);
  }

  /** @param {{ animationName: string }} event */
  function handleAnimationend(event) {
    if (event.animationName === "hide-feedback") {
      animation = undefined;
      feedbackOpen = false;
      copyActive = false;
      copyFailed = false;
      notify();
    }
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
