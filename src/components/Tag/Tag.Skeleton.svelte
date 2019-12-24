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
  class={cx('--tag', '--skeleton', className)}
  {style} />
