<script>
  /**
   * @template [T=any]
   * @event {null} save
   * @event update - Fires when the stored value changes, either from a bound value update or when localStorage is modified from another tab or window. Set `sync` to `"off"` to ignore updates from other tabs.
   * @property {T} prevValue
   * @property {T} value
   * @event {{ error: unknown }} error - Fires when a write to localStorage fails (e.g. quota exceeded or access denied).
   */

  /**
   * Specify the local storage key.
   */
  export let key = "local-storage-key";

  /**
   * Provide a value to persist.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * `"off"` ignores storage events from other tabs or windows on the same
   * origin. `"on"` (default) keeps the previous behavior.
   * @type {"on" | "off"}
   */
  export let sync = "on";

  /**
   * Remove the persisted key value from the browser's local storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearItem(); data = ""; }}>Clear Item</button>
   * ```
   */
  export function clearItem() {
    binding.clearItem();
  }

  /**
   * Clear all key values from the browser's local storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearAll(); data = ""; }}>Clear All Storage</button>
   * ```
   */
  export function clearAll() {
    binding.clearAll();
  }

  import StorageBinding from "./StorageBinding.svelte";

  /** @type {StorageBinding} */
  let binding;
</script>

<StorageBinding
  bind:this={binding}
  storageType="localStorage"
  {key}
  bind:value
  {sync}
  on:save
  on:update
  on:error
/>
