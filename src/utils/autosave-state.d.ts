export type AutosaveStatus =
  "idle" | "unsaved" | "saving" | "saved" | "error" | "offline";

export type AutosaveMachineState = {
  /** Edits so far. */
  revision: number;
  /** The revision the last save started with. */
  sentRevision: number;
  /** The newest revision a save confirmed. */
  savedRevision: number;
  /** A request is in flight. */
  saving: boolean;
  /** A failed save waits for its next attempt, or for the network. */
  retrying: boolean;
  /** The last settled save failed for good. Stays until a save succeeds. */
  failed: boolean;
  /** What the failed save threw. */
  error: unknown;
  /** Failed attempts since the last success. */
  attempts: number;
  online: boolean;
  /** When a save last succeeded. */
  savedAt: number | undefined;
};

export type AutosaveEvent =
  | { type: "change" }
  | { type: "start" }
  | { type: "success"; at: number }
  | { type: "failure"; error: unknown; retry: boolean }
  | { type: "online" }
  | { type: "offline" }
  | { type: "reset" };

export function createAutosaveState(options?: {
  online?: boolean;
  savedAt?: number;
}): AutosaveMachineState;

/** Whether a value is waiting, in flight or failed. */
export function isAutosaveDirty(state: AutosaveMachineState): boolean;

/** What to show, most urgent first. */
export function autosaveStatus(state: AutosaveMachineState): AutosaveStatus;

/** The pure transition. It reads no clock and starts no timer. */
export function autosaveReduce(
  state: AutosaveMachineState,
  event: AutosaveEvent,
): AutosaveMachineState;
