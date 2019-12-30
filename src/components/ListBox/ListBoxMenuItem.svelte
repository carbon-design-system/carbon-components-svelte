<script>
  let className = undefined;
  export { className as class };
  export let active = false;
  export let highlighted = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

<div
  class={cx('--list-box__menu-item', active && '--list-box__menu-item--active', highlighted && '--list-box__menu-item--highlighted', className)}
  {style}>
  <div class={cx('--list-box__menu-item__option')}>
    <slot />
  </div>
</div>
