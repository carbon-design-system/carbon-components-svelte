<script>
  let className = undefined;
  export { className as class };
  export let nested = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<ul
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--list--unordered', nested && '--list--nested', className)}
  {style}>
  <slot />
</ul>
