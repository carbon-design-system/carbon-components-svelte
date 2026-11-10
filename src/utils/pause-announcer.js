// @ts-check
import { writable } from "svelte/store";
import { debounce } from "./debounce.js";

/** Time (ms) a field waits for typing to pause before it announces. */
export const PAUSE_ANNOUNCEMENT_DELAY_MS = 1000;

/**
 * Text for a field's live region that follows typing without speaking every
 * keystroke. A change is spoken after typing pauses, or at once on `flush()`
 * (call it on blur). A message equal to the last one spoken is dropped, so a
 * change that is undone inside the pause says nothing. `prime()` sets the
 * baseline at mount so the initial value is not announced.
 *
 * @param {number} [delay]
 * @returns {import("svelte/store").Readable<string> & {
 *   prime: (text: string) => void,
 *   schedule: (text: string) => void,
 *   flush: () => void,
 *   cancel: () => void,
 * }}
 */
export function createPauseAnnouncer(delay = PAUSE_ANNOUNCEMENT_DELAY_MS) {
  const { subscribe, set } = writable("");
  let spoken = "";
  /** @type {string | undefined} */
  let pending;

  const speak = debounce(() => {
    if (pending !== undefined && pending !== spoken) {
      spoken = pending;
      set(pending);
    }
    pending = undefined;
  }, delay);

  return {
    subscribe,
    prime(text) {
      spoken = text;
    },
    schedule(text) {
      if (text === spoken) {
        pending = undefined;
        speak.cancel();
      } else if (text === "") {
        // The field was cleared: say nothing, and start over.
        pending = undefined;
        speak.cancel();
        spoken = "";
        set("");
      } else {
        pending = text;
        speak();
      }
    },
    flush: speak.flush,
    cancel() {
      pending = undefined;
      speak.cancel();
    },
  };
}
