export type TimeoutDismiss = {
  readonly timeoutId: ReturnType<typeof setTimeout> | undefined;
  sync: (open: boolean, timeout: number, onTimeout: () => void) => void;
  pause: () => void;
  resume: () => void;
  remainingMs: () => number;
  readonly running: boolean;
  clear: () => void;
};

export function createTimeoutDismiss(onChange?: () => void): TimeoutDismiss;
