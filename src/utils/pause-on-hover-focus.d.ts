export type HoverFocusPause = {
  handleMouseenter: () => void;
  handleMouseleave: (event: MouseEvent) => void;
  handleFocusIn: () => void;
  handleFocusOut: (event: FocusEvent) => void;
};

export function createHoverFocusPause(
  dismiss: { pause: () => void; resume: () => void },
  getPauseOnHover: () => boolean,
): HoverFocusPause;
