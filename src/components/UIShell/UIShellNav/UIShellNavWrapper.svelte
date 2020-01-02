<script>
  export let ariaLabel = undefined;

  import { cx } from '../../../lib';
</script>

<nav aria-label={ariaLabel} class={cx('--header__nav')}>
  <ul aria-label={ariaLabel} class={cx('--header__menu-bar')} role="menubar">
    <slot />
  </ul>
</nav>
