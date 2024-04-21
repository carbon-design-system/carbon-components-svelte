<script>
  // @ts-check
  
  /**
   * Specify the truncation direction
   * @type {"end" | "front"}
   */
  export let clamp = "end";

  /**
   * Specify the tag name
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "p";
</script>

<svelte:element
  this="{tag}"
  class:bx--text-truncate-end="{clamp === 'end'}"
  class:bx--text-truncate-front="{clamp === 'front'}"
  {...$$restProps}
>
  <slot />
</svelte:element>
