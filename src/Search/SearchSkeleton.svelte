<script>
  /**
   * Specify the size of the search input
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = "xl";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--skeleton="{true}"
  class:bx--search--sm="{size === 'sm'}"
  class:bx--search--lg="{size === 'lg'}"
  class:bx--search--xl="{size === 'xl'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--label="{true}"></span>
  <div class:bx--search-input="{true}"></div>
</div>
