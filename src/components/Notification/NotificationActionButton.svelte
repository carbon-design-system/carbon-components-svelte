<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import { cx } from '../../lib';
  import Button from '../Button';
</script>

<Button
  kind="ghost"
  size="small"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--inline-notification__action-button', className)}
  {style}>
  <slot />
</Button>
