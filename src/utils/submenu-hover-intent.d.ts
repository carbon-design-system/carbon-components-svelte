export interface SubmenuHoverIntent {
  open: () => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  cancelClose: () => void;
  cancel: () => void;
}

/** Create an open/close scheduler for hover-intent submenus. */
export function createSubmenuHoverIntent(
  setOpen: (open: boolean) => void,
  delays: { openDelay: number; closeDelay: number },
): SubmenuHoverIntent;
