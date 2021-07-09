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

  /**
   * Set to `true` for the bordered variant
   * @deprecated this prop will be removed in the next major release
   */
  export let shouldShowBorder = false;

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;
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
      class:bx--data-table--no-border="{!shouldShowBorder}"
      class:bx--data-table--sticky-header="{stickyHeader}"
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
    class:bx--data-table--no-border="{!shouldShowBorder}"
    class:bx--data-table--sticky-header="{stickyHeader}"
    {...$$restProps}
  >
    <slot />
  </table>
{/if}
