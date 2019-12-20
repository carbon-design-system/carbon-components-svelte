<script>
  import { cx } from '../../lib';
  export let style = undefined;
</script>

<span
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--tile-content__below-the-fold')}
  {style}>
  <slot />
</span>
