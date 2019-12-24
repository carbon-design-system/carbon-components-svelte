<script>
  let className = undefined;
  export { className as class };
  export let hasForm = false;
  export let hasScrollingContent = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--modal-content', hasForm && '--modal-content--with-form', className);
</script>

<div
  tabindex={hasScrollingContent ? '0' : undefined}
  role={hasScrollingContent ? 'region' : undefined}
  class={_class}
  {style}>
  <slot />
</div>
{#if hasScrollingContent}
  <div class={cx('--modal-content--overflow-indicator')} />
{/if}
