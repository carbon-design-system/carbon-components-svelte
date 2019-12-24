<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<li on:click on:mouseover on:mouseenter on:mouseleave class={cx('--list__item', className)} {style}>
  <slot />
</li>
