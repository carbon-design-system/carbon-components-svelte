export type HoverFocusPause = {
  handleMouseenter: () => void;
  handleMouseleave: (event: MouseEvent) => void;
  handleFocusIn: () => void;
  handleFocusOut: (event: FocusEvent) => void;
  /** Re-applies the hover/focus state, e.g. after the timer restarts. */
  refresh: () => void;
  /** Forgets the hover/focus state, e.g. when the root unmounts. */
  reset: () => void;
};

export function createHoverFocusPause(
  dismiss: { pause: () => void; resume: () => void },
  getPauseOnHover: () => boolean,
): HoverFocusPause;
