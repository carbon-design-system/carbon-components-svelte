<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random(); // TODO: Use context to re-use same id per ListBox
  export let style = undefined;

  import { cx } from '../../lib';

  $: menuId = `menu-${id}`;
</script>

<div role="listbox" id={menuId} class={cx('--list-box__menu', className)} {style}>
  <slot />
</div>
