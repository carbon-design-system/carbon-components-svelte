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
  <section class:cds--data-table_inner-container="{true}" {...$$restProps}>
    <table
      class:cds--data-table="{true}"
      class:cds--data-table--compact="{size === 'compact'}"
      class:cds--data-table--short="{size === 'short'}"
      class:cds--data-table--tall="{size === 'tall'}"
      class:cds--data-table--md="{size === 'medium'}"
      class:cds--data-table--sort="{sortable}"
      class:cds--data-table--zebra="{zebra}"
      class:cds--data-table--static="{useStaticWidth}"
      class:cds--data-table--sticky-header="{stickyHeader}"
      style="{tableStyle}"
    >
      <slot />
    </table>
  </section>
{:else}
  <table
    class:cds--data-table="{true}"
    class:cds--data-table--compact="{size === 'compact'}"
    class:cds--data-table--short="{size === 'short'}"
    class:cds--data-table--tall="{size === 'tall'}"
    class:cds--data-table--md="{size === 'medium'}"
    class:cds--data-table--sort="{sortable}"
    class:cds--data-table--zebra="{zebra}"
    class:cds--data-table--static="{useStaticWidth}"
    class:cds--data-table--sticky-header="{stickyHeader}"
    {...$$restProps}
    style="{tableStyle}"
  >
    <slot />
  </table>
{/if}
