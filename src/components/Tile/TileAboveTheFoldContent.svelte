<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<span
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--tile-content__above-the-fold', className)}
  {style}>
  <slot />
</span>
