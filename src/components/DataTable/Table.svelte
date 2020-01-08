<script>
  let className = undefined;
  export { className as class };
  export let zebra = false;
  export let size = undefined;
  export let useStaticWidth = false;
  export let shouldShowBorder = false;
  export let sortable = false;
  export let stickyHeader = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

{#if stickyHeader}
  <section class={cx('--data-table_inner-container', className)} {style}>
    <table
      class={cx('--data-table', size === 'compact' && '--data-table--compact', size === 'short' && '--data-table--short', size === 'tall' && '--data-table--tall', sortable && '--data-table--sort', zebra && '--data-table--zebra', useStaticWidth && '--data-table--static', !shouldShowBorder && '--data-table--no-border', stickyHeader && '--data-table--sticky-header')}>
      <slot />
    </table>
  </section>
{:else}
  <table
    class={cx('--data-table', size === 'compact' && '--data-table--compact', size === 'short' && '--data-table--short', size === 'tall' && '--data-table--tall', sortable && '--data-table--sort', zebra && '--data-table--zebra', useStaticWidth && '--data-table--static', !shouldShowBorder && '--data-table--no-border', stickyHeader && '--data-table--sticky-header', className)}
    {style}>
    <slot />
  </table>
{/if}
