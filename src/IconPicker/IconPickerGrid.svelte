<script>
  /**
   * Internal. The `PickerGrid` of `IconPicker`, with its cells drawn from the
   * icons a loader imports.
   * @extendProps {"../PickerGrid/PickerGrid.svelte"} PickerGridProps
   * @event {{ id: string; item: import("./icon-items.js").IconPickerItem; selected: boolean; }} select
   * @event {{ recent: string[]; }} recent:change
   */

  /** @type {string | undefined} */
  export let value = undefined;

  /** @type {ReadonlyArray<string>} */
  export let recent = [];

  /** @type {16 | 20 | 24 | 32 | 48 | 64} */
  export let iconSize = 24;

  /** @type {ReturnType<typeof import("./icon-loader.js").createIconLoader>} */
  export let loader;

  /** @type {() => void} */
  export function focus() {
    gridRef?.focus();
  }

  /** @type {() => void} */
  export function reset() {
    gridRef?.reset();
  }

  import { onMount } from "svelte";
  import PickerGrid from "../PickerGrid/PickerGrid.svelte";
  import { PICKER_LOAD_SETTLE_MS } from "../constants/timing.js";
  import { debounce } from "../utils/debounce.js";
  import { resolveIcon } from "./icon-loader.js";

  /** @type {null | PickerGrid} */
  let gridRef = null;
  $: icons = loader.icons;

  // A scroll that passes hundreds of cells imports only the window it comes
  // to rest on. Importing a window that is gone by the time it arrives costs
  // main-thread time and shows nothing.
  const loadSettled = debounce((items) => {
    loader.load(
      /** @type {import("./icon-items.js").IconPickerItem[]} */ (items),
    );
  }, PICKER_LOAD_SETTLE_MS);

  onMount(() => () => loadSettled.cancel());

  /** @param {CustomEvent<{ items: import("./icon-items.js").IconPickerItem[]; scrolling: boolean }>} event */
  function handleWindow(event) {
    const { items, scrolling } = event.detail;
    if (scrolling) {
      loadSettled(items);
      return;
    }
    loadSettled.cancel();
    loader.load(items);
  }
</script>

<PickerGrid
  bind:this={gridRef}
  cellSize={iconSize + 16}
  bind:selectedId={value}
  bind:recent
  {...$$restProps}
  on:select
  on:recent:change
  on:window:change={handleWindow}
>
  <svelte:fragment slot="cell" let:item>
    {#if resolveIcon(item, $icons)}
      <svelte:component
        this={resolveIcon(item, $icons)}
        width={iconSize}
        height={iconSize}
      />
    {:else}
      <span
        class:bx--icon-picker__placeholder={true}
        style:--ccs-icon-picker-size="{iconSize}px"
      ></span>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="preview" let:item>
    <span class:bx--icon-picker__preview-icon={true}>
      <svelte:component
        this={resolveIcon(item, $icons)}
        width={32}
        height={32}
      />
    </span>
    <span class:bx--icon-picker__preview-name={true}>{item.label}</span>
    <code class:bx--icon-picker__preview-id={true}>{item.id}</code>
  </svelte:fragment>
</PickerGrid>
