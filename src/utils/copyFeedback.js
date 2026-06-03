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
 *   get timeout(): ReturnType<typeof setTimeout> | undefined,
 *   dismiss: () => void,
 *   onClick: (performCopy: () => void, feedbackTimeout: number) => void,
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

  function notify() {
    onSync?.();
  }

  function dismiss() {
    feedbackOpen = false;
    animation = undefined;
    copyActive = false;
    clearTimeout(timeout);
    timeout = undefined;
    notify();
  }

  function cleanup() {
    feedbackOpen = false;
    animation = undefined;
    copyActive = false;
    clearTimeout(timeout);
    timeout = undefined;
  }

  /**
   * @param {() => void} performCopy
   * @param {number} feedbackTimeout
   */
  function onClick(performCopy, feedbackTimeout) {
    if (copyActive || animation === "fade-in") return;

    copyActive = true;
    performCopy();
    animation = "fade-in";
    feedbackOpen = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      animation = "fade-out";
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
    get timeout() {
      return timeout;
    },
    dismiss,
    onClick,
    onAnimationEnd,
    cleanup,
  };
}
