<script>
  let className = undefined;
  export { className as class };
  export let light = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--tile', light && '--tile--light', className)}
  {style}>
  <slot />
</div>
