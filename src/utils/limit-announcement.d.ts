import type { Readable } from "svelte/store";

/** Time (ms) a field waits before it announces a reached limit, as Carbon does. */
export const LIMIT_ANNOUNCEMENT_DELAY_MS: number;

export type LimitAnnouncement = Readable<string> & {
  /** Call with every count change. */
  track: (
    count: number,
    maxCount: number | null | undefined,
    text: string,
  ) => void;
  /** Drop a pending announcement, for example on unmount. */
  cancel: () => void;
};

/** Text for a field's live region when its count reaches the limit. */
export function createLimitAnnouncement(
  initialCount: number,
): LimitAnnouncement;
