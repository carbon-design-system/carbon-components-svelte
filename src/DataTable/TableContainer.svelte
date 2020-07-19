<script>
  export let stickyHeader = false;
  export let title = "";
  export let description = "";
</script>

<div
  class:bx--data-table-container={true}
  class:bx--data-table--max-width={stickyHeader}
  {...$$restProps}>
  {#if title}
    <div class:bx--data-table-header={true}>
      <h4 class:bx--data-table-header__title={true}>{title}</h4>
      <p class:bx--data-table-header__description={true}>{description}</p>
    </div>
  {/if}
  <slot />
</div>
