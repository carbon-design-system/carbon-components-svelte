import type { Readable } from "svelte/store";

/**
 * Text for a polite live region that follows a result count. The count is
 * said once it stops changing for `delay` milliseconds, and the count at
 * mount is not said.
 */
export function createResultAnnouncer(
  initial: number | undefined,
  delay: number,
): Readable<string> & {
  track: (count: number | undefined, text: (count: number) => string) => void;
  cancel: () => void;
};
