/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface SessionStorageProps {
  /**
   * Specify the local storage key
   * @default "session-storage-key"
   */
  key?: string;

  /**
   * Provide a value to persist
   * @default ""
   */
  value?: any;
}

export default class SessionStorage extends SvelteComponentTyped<
  SessionStorageProps,
  {
    save: WindowEventMap["save"];
    update: WindowEventMap["update"];
    updateKey: WindowEventMap["updateKey"];
  },
  {}
> {
  /**
   * Remove the persisted key value from the browser's local storage
   */
  clearItem: () => void;

  /**
   * Clear all key values from the browser's local storage
   */
  clearAll: () => void;
}
