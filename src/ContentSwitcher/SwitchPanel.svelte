<script>
  /**
   * Set an id for the panel element.
   * Prefer a stable value when switches are added or removed.
   */
  export let id = uniqueId();

  /**
   * Set to `true` to defer mounting panel content until its switch is first selected
   */
  export let lazy = false;

  /**
   * Set to `true` to unmount panel content when its switch is deselected
   */
  export let unmountOnHide = false;

  /**
   * Obtain a reference to the panel HTML element.
   * @type {HTMLDivElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const { currentId, pairs, addPanel, removePanel } = getContext(
    "carbon:ContentSwitcher",
  );

  addPanel(id);

  onMount(() => {
    return () => {
      removePanel(id);
    };
  });

  let selectedOnce = false;

  // Paired by position with the switch at the same index.
  $: switchId = $pairs.switchByPanel[id];
  $: selected = switchId !== undefined && $currentId === switchId;
  $: if (selected) selectedOnce = true;
  $: shouldMount = unmountOnHide ? selected : lazy ? selectedOnce : true;
</script>

<div
  bind:this={ref}
  role="tabpanel"
  tabindex="0"
  aria-labelledby={switchId}
  hidden={selected ? undefined : ""}
  {id}
  {...$$restProps}
>
  {#if shouldMount}
    <slot />
  {/if}
</div>
