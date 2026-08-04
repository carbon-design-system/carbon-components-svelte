export type TimeoutDismiss = {
  readonly timeoutId: ReturnType<typeof setTimeout> | undefined;
  sync: (open: boolean, timeout: number, onTimeout: () => void) => void;
  pause: () => void;
  resume: () => void;
  clear: () => void;
};

export function createTimeoutDismiss(): TimeoutDismiss;
