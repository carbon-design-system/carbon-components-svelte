<script>
  /**
   * Set the size of the table
   * @type {"compact" | "short" | "medium" | "tall"}
   */
  export let size = undefined;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /**
   * Set the style attribute on the `table` element
   * @type {string}
   */
  export let tableStyle = undefined;
</script>

{#if stickyHeader}
  <section class:bx--data-table_inner-container="{true}" {...$$restProps}>
    <table
      class:bx--data-table="{true}"
      class:bx--data-table--compact="{size === 'compact'}"
      class:bx--data-table--short="{size === 'short'}"
      class:bx--data-table--tall="{size === 'tall'}"
      class:bx--data-table--md="{size === 'medium'}"
      class:bx--data-table--sort="{sortable}"
      class:bx--data-table--zebra="{zebra}"
      class:bx--data-table--static="{useStaticWidth}"
      class:bx--data-table--sticky-header="{stickyHeader}"
      style="{tableStyle}"
    >
      <slot />
    </table>
  </section>
{:else}
  <table
    class:bx--data-table="{true}"
    class:bx--data-table--compact="{size === 'compact'}"
    class:bx--data-table--short="{size === 'short'}"
    class:bx--data-table--tall="{size === 'tall'}"
    class:bx--data-table--md="{size === 'medium'}"
    class:bx--data-table--sort="{sortable}"
    class:bx--data-table--zebra="{zebra}"
    class:bx--data-table--static="{useStaticWidth}"
    class:bx--data-table--sticky-header="{stickyHeader}"
    {...$$restProps}
    style="{tableStyle}"
  >
    <slot />
  </table>
{/if}
