<script>
  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  import { getContext, onMount } from "svelte";

  const { selectedContent, addContent, removeContent, tabs, contentById } =
    getContext("carbon:Tabs");

  addContent({ id });

  onMount(() => {
    return () => {
      removeContent(id);
    };
  });

  $: selected = $selectedContent === id;
  $: index = $contentById[id]?.index ?? 0;
  $: tabId = $tabs[index]?.id;
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
  <slot />
</div>
