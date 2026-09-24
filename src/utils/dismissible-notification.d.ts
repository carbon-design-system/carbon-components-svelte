export interface DismissibleNotification {
  close: (closeFromTimeout?: unknown) => void;
  sync: (open: boolean, timeout: number) => void;
  handleMouseenter: () => void;
  handleMouseleave: (event: MouseEvent) => void;
  handleFocusIn: () => void;
  handleFocusOut: (event: FocusEvent) => void;
  dispose: () => void;
}

export interface DismissibleNotificationOptions {
  dispatch: (name: string, detail?: object, options?: object) => boolean;
  getPauseOnHover: () => boolean;
  setOpen: (open: boolean) => void;
}

/** Shared open/close + auto-dismiss + pause-on-hover wiring. */
export function createDismissibleNotification(
  options: DismissibleNotificationOptions,
): DismissibleNotification;
