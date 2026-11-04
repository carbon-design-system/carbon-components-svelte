// @ts-check
import { writable } from "svelte/store";
import { debounce } from "../utils/debounce.js";

/**
 * Text for a polite live region that follows a result count.
 *
 * Filtering changes the count on every click, and a screen reader that reads
 * each one falls behind. The announcement waits until the count stops
 * changing, then says the last one. A count that comes back to what the
 * region already said is not repeated, and the count at mount is not said at
 * all.
 *
 * @param {number | undefined} initial The count at mount.
 * @param {number} delay Quiet time in milliseconds before the count is said.
 * @returns {import("svelte/store").Readable<string> & {
 *   track: (count: number | undefined, text: (count: number) => string) => void,
 *   cancel: () => void,
 * }}
 */
export function createResultAnnouncer(initial, delay) {
  const { subscribe, set } = writable("");
  let said = initial;
  /** @type {number | undefined} */
  let latest;
  /** @type {((count: number) => string) | undefined} */
  let format;
  const announce = debounce(() => {
    if (latest === undefined || !format || latest === said) return;
    said = latest;
    set(format(latest));
  }, delay);

  return {
    subscribe,
    track(count, text) {
      format = text;
      latest = count;
      if (count === undefined) {
        announce.cancel();
        return;
      }
      announce();
    },
    cancel() {
      announce.cancel();
    },
  };
}
