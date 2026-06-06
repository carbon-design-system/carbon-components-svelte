// @ts-check

/** @typedef {'fade-in' | 'fade-out' | undefined} CopyFeedbackAnimation */

/**
 * Copy-button "Copied!" feedback (fade-in/out, portal tooltip).
 * `copyActive` blocks a second click before Svelte assigns `animation`.
 *
 * @param {() => void} [onSync] - Run after internal state changes (sync component `let`s).
 * @returns {{
 *   get animation(): CopyFeedbackAnimation,
 *   get feedbackOpen(): boolean,
 *   get copyPending(): boolean,
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

  function notify() {
    onSync?.();
  }

  function dismiss() {
    feedbackOpen = false;
    animation = undefined;
    copyActive = false;
    copyPending = false;
    clearTimeout(timeout);
    timeout = undefined;
    notify();
  }

  function cleanup() {
    feedbackOpen = false;
    animation = undefined;
    copyActive = false;
    copyPending = false;
    clearTimeout(timeout);
    timeout = undefined;
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
  async function onClick(performCopy, feedbackTimeout, portalled = false) {
    if (copyActive || animation === "fade-in") return;

    copyActive = true;
    copyPending = true;
    notify();

    try {
      await performCopy();
    } catch (error) {
      copyActive = false;
      copyPending = false;
      notify();
      throw error;
    }

    copyPending = false;
    animation = "fade-in";
    feedbackOpen = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (portalled) {
        feedbackOpen = false;
        animation = undefined;
        copyActive = false;
      } else {
        animation = "fade-out";
      }
      notify();
    }, feedbackTimeout);
    notify();
  }

  /** @param {{ animationName: string }} event */
  function onAnimationEnd(event) {
    if (event.animationName === "hide-feedback") {
      animation = undefined;
      feedbackOpen = false;
      copyActive = false;
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
    dismiss,
    onClick,
    onAnimationEnd,
    cleanup,
  };
}
