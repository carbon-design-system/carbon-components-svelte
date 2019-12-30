<script>
  export let active = false;
  export let highlighted = false;

  import { cx } from '../../lib';
</script>

<div
  on:click
  on:mouseenter
  on:mouseleave
  class={cx('--list-box__menu-item', active && '--list-box__menu-item--active', highlighted && '--list-box__menu-item--highlighted')}>
  <div class={cx('--list-box__menu-item__option')}>
    <slot />
  </div>
</div>
