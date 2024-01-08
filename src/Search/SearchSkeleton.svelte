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
  class:cds--skeleton="{true}"
  class:cds--search--sm="{size === 'sm'}"
  class:cds--search--md="{size === 'md'}"
  class:cds--search--lg="{size === 'lg'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:cds--label="{true}"></span>
  <div class:cds--search-input="{true}"></div>
</div>
