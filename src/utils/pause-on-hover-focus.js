// @ts-check

/**
 * Pause/resume a `createTimeoutDismiss()` timer while the pointer is over a
 * root element or focus is inside it. Shared by `ToastNotification` and
 * `InlineNotification`, whose `pauseOnHover` mouse/focus handling was
 * previously duplicated verbatim.
 *
 * `focusout`/`mouseleave` only resume the timer once focus has actually left
 * the root: a `relatedTarget` still inside the root (tabbing, or the pointer
 * moving between two focusables) and the root still containing
 * `document.activeElement` (pointer leaving while a child keeps focus) both
 * block the resume.
 *
 * @param {{ pause: () => void, resume: () => void }} dismiss
 * @param {() => boolean} getPauseOnHover
 * @returns {{
 *   handleMouseenter: () => void,
 *   handleMouseleave: (event: MouseEvent) => void,
 *   handleFocusIn: () => void,
 *   handleFocusOut: (event: FocusEvent) => void,
 * }}
 */
export function createHoverFocusPause(dismiss, getPauseOnHover) {
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

  /**
   * @param {MouseEvent | FocusEvent} event
   */
  function resumeUnlessStillInside(event) {
    if (!getPauseOnHover() || pointerInside(event)) return;
    if (
      event.currentTarget instanceof Node &&
      event.currentTarget.contains(document.activeElement)
    ) {
      return;
    }
    dismiss.resume();
  }

  return {
    handleMouseenter() {
      if (getPauseOnHover()) dismiss.pause();
    },
    handleMouseleave: resumeUnlessStillInside,
    handleFocusIn() {
      if (getPauseOnHover()) dismiss.pause();
    },
    handleFocusOut: resumeUnlessStillInside,
  };
}
