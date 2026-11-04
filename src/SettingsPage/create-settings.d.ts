import type { Readable, Writable } from "svelte/store";
import type { UnsavedChangesStore } from "../UnsavedChanges/unsaved-changes.js";

// biome-ignore lint/suspicious/noExplicitAny: a setting holds any value
export type SettingsValues = Record<string, any>;

/** What a save handler may resolve. `errors` maps a field name to a message. */
// biome-ignore lint/suspicious/noConfusingVoidType: a handler that returns nothing saves
export type SettingsSaveResult = { errors?: Record<string, string> } | void;

export type SettingsStatus = {
  state: "idle" | "saving" | "saved" | "error";
  /** What a rejected handler threw. */
  error?: unknown;
};

export type SettingsOutcome = {
  ok: boolean;
  /** The field messages the handler resolved. */
  errors?: Record<string, string>;
  /** What the handler threw. */
  error?: unknown;
};

export type SettingsOptions<T extends SettingsValues> = {
  /**
   * The factory default of each field, which "Reset to default" restores.
   * A field with no default has no reset. Defaults to the saved values.
   */
  defaults?: Partial<T>;
  /**
   * Update the saved values when a save starts and roll them back if it
   * fails, so the page reads clean without waiting for the server.
   * @default false
   */
  optimistic?: boolean;
  /**
   * Show the browser's leave-page prompt while the page is dirty.
   * @default true
   */
  beforeUnload?: boolean;
};

export interface SettingsStore<T extends SettingsValues> {
  /** The working values. Bind a field with `bind:value={$values.name}`. */
  values: Writable<T>;
  /** The last saved values. */
  saved: Readable<T>;
  /** The fields that differ from the saved values. */
  modified: Readable<ReadonlySet<string>>;
  /** The fields that differ from their factory default. */
  customized: Readable<ReadonlySet<string>>;
  /** `true` while any field differs from the saved values. */
  dirty: Readable<boolean>;
  /** How many fields differ from the saved values. */
  changed: Readable<number>;
  /** Field messages from the server. Editing a field withdraws its message. */
  errors: Readable<Record<string, string>>;
  /** `true` while a save is in flight. */
  saving: Readable<boolean>;
  /** The state of the last save. */
  status: Readable<SettingsStatus>;
  /**
   * The leave guard `SettingsPage` keeps in step with `dirty`. Call
   * `unsaved.guard()` or `unsaved.interrupt()` from a router hook.
   */
  unsaved: UnsavedChangesStore;
  /** Show messages on their fields, such as ones a server returned. */
  setErrors: (messages: Record<string, string>) => void;
  clearErrors: () => void;
  /** Put a field back to its factory default. */
  resetField: (key: keyof T & string) => void;
  /** Put every field back to its last saved value. */
  discard: () => void;
  /** Take new values as both the working and the saved values. */
  load: (next: T) => void;
  /**
   * Run `handler` with a copy of the values. A resolved handler saves them;
   * resolve `{ errors }` to reject fields, or throw to fail the save. Either
   * failure leaves the page dirty.
   */
  save: (
    handler: (values: T) => SettingsSaveResult | Promise<SettingsSaveResult>,
  ) => Promise<SettingsOutcome>;
}

/**
 * Create the state of a settings page: the working values, the last saved
 * values, the factory defaults, and the server's field errors.
 */
export function createSettings<T extends SettingsValues>(
  initial: T,
  options?: SettingsOptions<T>,
): SettingsStore<T>;
