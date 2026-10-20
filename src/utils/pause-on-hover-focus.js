// @ts-check

/**
 * Pause/resume a `createTimeoutDismiss()` timer while the pointer is over a
 * root element or focus is inside it. Shared by `ToastNotification` and
 * `InlineNotification`, whose `pauseOnHover` mouse/focus handling was
 * previously duplicated verbatim.
 *
 * Hover and focus are tracked separately, so the timer stays paused until
 * both the pointer and focus have left the root. A `relatedTarget` still
 * inside the root (tabbing, or the pointer moving between two focusables)
 * keeps focus inside, as does the root still containing
 * `document.activeElement` when the pointer leaves.
 *
 * `refresh()` re-applies the current state, e.g. after `dismiss.sync()`
 * restarted the timer unpaused. `reset()` forgets it when the root unmounts,
 * which fires no `mouseleave`/`focusout`.
 *
 * @param {{ pause: () => void, resume: () => void }} dismiss
 * @param {() => boolean} getPauseOnHover
 * @returns {{
 *   handleMouseenter: () => void,
 *   handleMouseleave: (event: MouseEvent) => void,
 *   handleFocusIn: () => void,
 *   handleFocusOut: (event: FocusEvent) => void,
 *   refresh: () => void,
 *   reset: () => void,
 * }}
 */
export function createHoverFocusPause(dismiss, getPauseOnHover) {
  let hovered = false;
  let focused = false;

  /**
   * @param {MouseEvent | FocusEvent} event
   */
  function pointerInside(event) {
    const next = event.relatedTarget;
    const current = event.currentTarget;
    return (
      next instanceof Node && current instanceof Node && current.contains(next)
    );
  }

  // Also resumes when `pauseOnHover` was turned off while paused.
  function apply() {
    if (getPauseOnHover() && (hovered || focused)) dismiss.pause();
    else dismiss.resume();
  }

  return {
    handleMouseenter() {
      hovered = true;
      apply();
    },
    handleMouseleave(event) {
      hovered = false;
      if (
        event.currentTarget instanceof Node &&
        event.currentTarget.contains(document.activeElement)
      ) {
        focused = true;
      }
      apply();
    },
    handleFocusIn() {
      focused = true;
      apply();
    },
    handleFocusOut(event) {
      focused = pointerInside(event);
      apply();
    },
    refresh: apply,
    reset() {
      hovered = false;
      focused = false;
    },
  };
}
