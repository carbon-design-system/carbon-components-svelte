export interface DismissibleNotification {
  close: (closeFromTimeout?: unknown) => void;
  /** `hasAction` makes the notification ignore `timeout` (WCAG 2.2.1). */
  sync: (open: boolean, timeout: number, hasAction?: boolean) => void;
  syncFocusOnOpen: (open: boolean, enabled: boolean) => void;
  handleActionableKeydown: (
    event: KeyboardEvent,
    options: { closeOnEscape: boolean; hideCloseButton: boolean },
  ) => void;
  handleMouseenter: () => void;
  handleMouseleave: (event: MouseEvent) => void;
  handleFocusIn: (event: FocusEvent) => void;
  handleFocusOut: (event: FocusEvent) => void;
  /** Holds the timer paused, or releases it with the time it had left. */
  setPaused: (paused: boolean) => void;
  dispose: () => void;
}

export interface DismissibleNotificationOptions {
  dispatch: (name: string, detail?: object, options?: object) => boolean;
  getPauseOnHover: () => boolean;
  setOpen: (open: boolean) => void;
  getRef?: () => HTMLElement | null | undefined;
}

/** Shared open/close + auto-dismiss + pause-on-hover wiring. */
export function createDismissibleNotification(
  options: DismissibleNotificationOptions,
): DismissibleNotification;

/**
 * Focus an actionable notification's first action, else its close button,
 * else the notification itself.
 */
export function focusActionableNotification(
  root: HTMLElement | null | undefined,
): void;
