<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let style = undefined;

  import { cx } from '../../lib';

  $: menuId = `menu-${id}`;
</script>

<div
  role="listbox"
  id={menuId}
  aria-labelledby={$$props['aria-labelledby']}
  aria-label={$$props['aria-label']}
  class={cx('--list-box__menu', className)}
  {style}>
  <slot />
</div>
