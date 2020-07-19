<script>
  export let hasForm = false;
  export let hasScrollingContent = false;
</script>

<div
  tabindex={hasScrollingContent ? '0' : undefined}
  role={hasScrollingContent ? 'region' : undefined}
  class:bx--modal-content={true}
  class:bx--modal-content--with-form={hasForm}
  {...$$restProps}>
  <slot />
</div>
{#if hasScrollingContent}
  <div class:bx--modal-content--overflow-indicator={true} />
{/if}
