export type DelayedSetter = ((delay: number, callback: () => void) => void) & {
  cancel: () => void;
};

/** Create a canceling delayed-call scheduler for hover-intent style UI. */
export function createDelayedSetter(): DelayedSetter;
