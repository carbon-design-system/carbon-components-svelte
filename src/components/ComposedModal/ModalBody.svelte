<script>
  let className = undefined;
  export { className as class };
  export let hasForm = false;
  export let hasScrollingContent = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  tabindex={hasScrollingContent ? '0' : undefined}
  role={hasScrollingContent ? 'region' : undefined}
  class={cx('--modal-content', hasForm && '--modal-content--with-form', className)}
  {style}>
  <slot />
</div>
{#if hasScrollingContent}
  <div class={cx('--modal-content--overflow-indicator')} />
{/if}
