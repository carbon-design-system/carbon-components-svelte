<script>
  /**
   * Specify the content `span` props
   * @type {import('svelte/elements').HTMLDivAttributes}
   */
  export let contentProps = {};
</script>

<span class:bx--popover="{true}">
  <span class:bx--popover-content="{true}" {...contentProps}>
    <slot />
  </span>
  <span class:bx--popover-caret="{true}"></span>
</span>
