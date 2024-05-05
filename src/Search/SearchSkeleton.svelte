<script>
  // @ts-check

  /**
   * Specify the size of the search input
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";
</script>

<div
  class:bx--skeleton="{true}"
  class:bx--search--sm="{size === 'sm'}"
  class:bx--search--md="{size === 'md'}"
  class:bx--search--lg="{size === 'lg'}"
>
  <span class:bx--label="{true}"></span>
  <div class:bx--search-input="{true}"></div>
</div>
