/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface LocalStorageProps {
  /**
   * Specify the local storage key
   * @default "local-storage-key"
   */
  key?: string;

  /**
   * Provide a value to persist
   * @default ""
   */
  value?: any;
}

export default class LocalStorage extends SvelteComponentTyped<
  LocalStorageProps,
  {
    save: CustomEvent<null>;
    update: CustomEvent<{ prevValue: any; value: any }>;
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
