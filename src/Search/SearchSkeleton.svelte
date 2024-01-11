<script>
  /**
   * Specify the size of the search input
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--skeleton="{true}"
  class:bx--search--sm="{size === 'sm'}"
  class:bx--search--md="{size === 'md'}"
  class:bx--search--lg="{size === 'lg'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--label="{true}"></span>
  <div class:bx--search-input="{true}"></div>
</div>
