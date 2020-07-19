<script>
  export let size = undefined; // "compact" | "short" | "tall"
  export let zebra = false;
  export let useStaticWidth = false;
  export let shouldShowBorder = false;
  export let sortable = false;
  export let stickyHeader = false;
</script>

{#if stickyHeader}
  <section class:bx--data-table_inner-container={true} {...$$restProps}>
    <table
      class:bx--data-table={true}
      class:bx--data-table--compact={size === 'compact'}
      class:bx--data-table--short={size === 'short'}
      class:bx--data-table--tall={size === 'tall'}
      class:bx--data-table--sort={sortable}
      class:bx--data-table--zebra={zebra}
      class:bx--data-table--static={useStaticWidth}
      class:bx--data-table--no-border={!shouldShowBorder}
      class:bx--data-table--sticky-header={stickyHeader}>
      <slot />
    </table>
  </section>
{:else}
  <table
    class:bx--data-table={true}
    class:bx--data-table--compact={size === 'compact'}
    class:bx--data-table--short={size === 'short'}
    class:bx--data-table--tall={size === 'tall'}
    class:bx--data-table--sort={sortable}
    class:bx--data-table--zebra={zebra}
    class:bx--data-table--static={useStaticWidth}
    class:bx--data-table--no-border={!shouldShowBorder}
    class:bx--data-table--sticky-header={stickyHeader}
    {...$$restProps}>
    <slot />
  </table>
{/if}
