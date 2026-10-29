export interface SubmenuHoverIntent {
  open: () => void;
  scheduleOpen: () => void;
  /** Pass the `mouseleave` event to hold the close while the pointer aims at the submenu. */
  scheduleClose: (event?: MouseEvent) => void;
  cancelClose: () => void;
  cancel: () => void;
}

/** Create an open/close scheduler for hover-intent submenus. */
export function createSubmenuHoverIntent(
  setOpen: (open: boolean) => void,
  options: {
    openDelay: number;
    closeDelay: number;
    /** Interval to re-check the pointer's aim; a pointer still for this long has paused. */
    aimPause?: number;
    /** The open submenu, or null when closed. */
    getSubmenu?: () => Element | null | undefined;
  },
): SubmenuHoverIntent;
