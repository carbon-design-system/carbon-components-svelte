<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<form
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit|preventDefault
  class={cx('--form', className)}
  {style}>
  <slot />
</form>
