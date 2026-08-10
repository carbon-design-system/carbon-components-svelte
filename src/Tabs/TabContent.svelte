<script>
  /**
   * Set an id for the top-level element.
   * Prefer a stable value when pairing panels with dynamic tabs.
   */
  export let id = uniqueId();

  /**
   * Set to `true` to defer mounting panel content until this tab is first selected
   */
  export let lazy = false;

  /**
   * Set to `true` to unmount panel content when the tab is deselected
   */
  export let unmountOnHide = false;

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  const { selectedContent, addContent, removeContent, tabs, contentById } =
    getContext("carbon:Tabs");

  addContent({ id });

  onMount(() => {
    return () => {
      removeContent(id);
    };
  });

  let hasBeenSelected = false;

  $: selected = $selectedContent === id;
  $: if (selected) hasBeenSelected = true;
  $: index = $contentById[id]?.index ?? 0;
  $: tabId = $tabs[index]?.id;
  $: shouldMount = unmountOnHide ? selected : lazy ? hasBeenSelected : true;
</script>

<div
  role="tabpanel"
  aria-labelledby={tabId}
  aria-hidden={!selected}
  hidden={selected ? undefined : ""}
  {id}
  class:bx--tab-content={true}
  {...$$restProps}
>
  {#if shouldMount}
    <slot />
  {/if}
</div>
