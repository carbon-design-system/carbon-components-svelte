<script>
  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  import { getContext } from "svelte";

  const { selectedContent, addContent, tabs, contentById } = getContext("Tabs");

  addContent({ id });

  $: selected = $selectedContent === id;
  $: index = $contentById[id].index;
  $: tabId = $tabs[index].id;
</script>

<div
  role="tabpanel"
  aria-labelledby="{tabId}"
  aria-hidden="{!selected}"
  hidden="{selected ? undefined : ''}"
  id="{id}"
  class:bx--tab-content="{true}"
  {...$$restProps}
>
  <slot />
</div>
