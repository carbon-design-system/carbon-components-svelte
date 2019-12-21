<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  import Button from '../Button';
  import { cx } from '../../lib';

  const _class = cx('--inline-notification__action-button', className);
</script>

<Button
  kind="ghost"
  size="small"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={_class}
  {style}>
  <slot />
</Button>
