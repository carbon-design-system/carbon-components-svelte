<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<ul on:click on:mouseover on:mouseenter on:mouseleave class={cx('--accordion', className)} {style}>
  <slot />
</ul>
