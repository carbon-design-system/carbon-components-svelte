<script>
  /** Set to `true` if the modal contains form elements */
  export let hasForm = false;

  /** Set to `true` if the modal contains scrolling content */
  export let hasScrollingContent = false;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  tabindex="{hasScrollingContent ? '0' : undefined}"
  role="{hasScrollingContent ? 'region' : undefined}"
  class:bx--modal-content="{true}"
  class:bx--modal-content--with-form="{hasForm}"
  class:bx--modal-scroll-content="{hasScrollingContent}"
  {...$$restProps}
>
  <slot />
</div>
{#if hasScrollingContent}
  <div class:bx--modal-content--overflow-indicator="{true}"></div>
{/if}
