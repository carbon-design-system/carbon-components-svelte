<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<label
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  for={id}
  class={cx('--label', className)}
  {style}>
  <slot />
</label>
