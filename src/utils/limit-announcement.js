// @ts-check
import { writable } from "svelte/store";
import { debounce } from "./debounce.js";

/** Time (ms) a field waits before it announces a reached limit, as Carbon does. */
export const LIMIT_ANNOUNCEMENT_DELAY_MS = 1000;

/**
 * Text for a field's live region when its count reaches the limit.
 *
 * It waits until typing settles. A screen reader can drop a live update that
 * lands while it echoes the last keystroke, and a quick backspace off the
 * limit stays silent. A value that starts at the limit is not announced.
 *
 * @param {number} initialCount - The count at mount.
 * @returns {import("svelte/store").Readable<string> & {
 *   track: (count: number, maxCount: number | null | undefined, text: string) => void,
 *   cancel: () => void,
 * }}
 */
export function createLimitAnnouncement(initialCount) {
  const { subscribe, set } = writable("");
  let prevCount = initialCount;
  let text = "";
  const announce = debounce(() => set(text), LIMIT_ANNOUNCEMENT_DELAY_MS);

  return {
    subscribe,
    track(count, maxCount, limitText) {
      text = limitText;
      const reached =
        typeof maxCount === "number" && maxCount > 0 && count === maxCount;
      if (!reached) {
        announce.cancel();
        set("");
      } else if (prevCount !== count) {
        announce();
      }
      prevCount = count;
    },
    cancel: announce.cancel,
  };
}
