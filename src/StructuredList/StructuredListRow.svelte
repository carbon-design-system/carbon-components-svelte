<script>
  // @ts-check

  /**
   * Specify the tag name
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Set to `true` to use the selected state
   * @type {boolean}
   */
  export let selected = false;

  import { getContext } from "svelte";

  /** @type {undefined | import("svelte/store").Writable<{}>} */
  const head = getContext("StructuredListHead");
</script>

<svelte:element
  this="{tag}"
  class:bx--structured-list-row="{true}"
  class:bx--structured-list-row--header-row="{head}"
  class:bx--structured-list-row--selected="{selected}"
  {...$$restProps}
  role="row"
>
  <slot />
</svelte:element>
