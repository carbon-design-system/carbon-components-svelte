/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface WebStorageProps {
  /**
   * Specify the local storage key
   * @default "storage-key"
   */
  key?: string;

  /**
   * Provide a value to persist
   * @default ""
   */
  value?: any;

  /**
   * Select WebStorage to use
   * @default "local"
   */
  storage?: "local" | "session";
}

export default class WebStorage extends SvelteComponentTyped<
  WebStorageProps,
  {
    save: CustomEvent<null>;
    updateKey: CustomEvent<{ prevKey: any; key: any }>;
    update: CustomEvent<{ prevValue: any; value: any }>;
  },
  {}
> {
  /**
   * Remove the persisted key value from the browser's selected WebStorage
   */
  clearItem: () => void;

  /**
   * Clear all key values from the browser's selected WebStorage
   */
  clearAll: () => void;
}
