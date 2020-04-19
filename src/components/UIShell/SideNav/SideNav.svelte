<script>
  export let ariaLabel = undefined;
  export let isOpen = undefined;

  import { cx } from '../../../lib';

  $: footerSpanText = isOpen ? 'Open' : 'Close';
</script>

<nav
  class={cx('--side-nav__navigation', '--side-nav', '--side-nav--ux', isOpen && '--side-nav--expanded')}
  aria-label={ariaLabel}>
  <slot />
</nav>
