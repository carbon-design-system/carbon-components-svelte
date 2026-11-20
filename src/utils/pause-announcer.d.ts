import type { Readable } from "svelte/store";

/** Time (ms) a field waits for typing to pause before it announces. */
export const PAUSE_ANNOUNCEMENT_DELAY_MS: number;

export type PauseAnnouncer = Readable<string> & {
  /** Set the baseline at mount so the initial value is not announced. */
  prime: (text: string) => void;
  /** Call with every change. Speaks after typing pauses; an empty string clears. */
  schedule: (text: string) => void;
  /** Speak a pending message now, for example on blur. */
  flush: () => void;
  /** Drop a pending message, for example on unmount. */
  cancel: () => void;
};

/**
 * Text for a field's live region that follows typing without speaking every
 * keystroke.
 */
export function createPauseAnnouncer(delay?: number): PauseAnnouncer;
