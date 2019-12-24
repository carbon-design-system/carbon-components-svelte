<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--breadcrumb', '--skeleton', className)}
  {style}>
  {#each [0, 1, 2] as item, i (item)}
    <div class={cx('--breadcrumb-item')}>
      <span class={cx('--link')}>&nbsp;</span>
    </div>
  {/each}
</div>
