<script>
  /**
   * Specify the toolbar size
   * @type {"sm" | "default"} [size="default"]
   */
  export let size = "default";
</script>

<section
  aria-label="data table toolbar"
  class:bx--table-toolbar="{true}"
  class:bx--table-toolbar--small="{size === 'sm'}"
  class:bx--table-toolbar--normal="{size === 'default'}"
  {...$$restProps}
>
  <div class:bx--toolbar-content="{true}">
    <slot />
  </div>
</section>
