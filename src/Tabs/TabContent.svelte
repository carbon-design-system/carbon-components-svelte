<script>
  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  import { getContext } from "svelte";

  const { selectedContent, addContent } = getContext("Tabs");

  addContent({ id });

  $: selected = $selectedContent === id;
</script>

<div
  aria-hidden={!selected}
  hidden={!selected}
  {id}
  {...$$restProps}
  class:bx--tab-content={true}
  class={$$restProps.class}
  style={$$restProps.style}>
  <slot />
</div>
