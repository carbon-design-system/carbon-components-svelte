import type { AutosaveStatus } from "../utils/autosave-state.js";

export type StatusDisplayOptions = {
  /**
   * Milliseconds a save must run before "Saving" shows.
   * @default 400
   */
  savingDelay?: number;
  /**
   * Milliseconds "Saving" stays once shown.
   * @default 600
   */
  savingMinimum?: number;
  /**
   * Milliseconds the status must stay saved before "Saved" shows.
   * @default 250
   */
  savedDelay?: number;
};

/**
 * Turns the machine's status into the one the user sees, so a status that
 * follows continuous typing does not flash. The first value applies at once.
 * @param onChange - Called with each new status to show.
 */
export function createStatusDisplay(
  onChange: (shown: AutosaveStatus) => void,
  options?: StatusDisplayOptions,
): ((status: AutosaveStatus) => void) & { cancel: () => void };
