<script>
  let className = undefined;
  export { className as class };
  export let stickyHeader = false;
  export let title = '';
  export let description = '';
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  class={cx('--data-table-container', stickyHeader && '--data-table--max-width', className)}
  {style}>
  {#if title}
    <div class={cx('--data-table-header')}>
      <h4 class={cx('--data-table-header__title')}>{title}</h4>
      <p class={cx('--data-table-header__description')}>{description}</p>
    </div>
  {/if}
  <slot />
</div>
