import { SvelteComponentTyped } from "svelte";

export type LocalStorageProps = {
  /**
   * Specify the local storage key.
   * @default "local-storage-key"
   */
  key?: string;

  /**
   * Provide a value to persist.
   * @default ""
   */
  value?: any;
};

export default class LocalStorage extends SvelteComponentTyped<
  LocalStorageProps,
  {
    save: CustomEvent<null>;
    /** Fires when the stored value changes, either from a bound value update or when localStorage is modified from another tab/window. */
    update: CustomEvent<{ prevValue: any; value: any }>;
  },
  Record<string, never>
> {
  /**
   * Remove the persisted key value from the browser's local storage
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => storage.clearItem()}>Clear Item</button>
   * ```
   */
  clearItem: () => void;

  /**
   * Clear all key values from the browser's local storage
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => storage.clearAll()}>Clear All Storage</button>
   * ```
   */
  clearAll: () => void;
}
