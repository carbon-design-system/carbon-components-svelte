<script>
  export let ariaLabel = undefined;
  export let isOpen = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { closeIcon } from '../constants';

  $: footerSpanText = isOpen ? 'Open' : 'Close';
</script>

<nav
  class={cx('--side-nav__navigation', '--side-nav', '--side-nav--ux', isOpen && '--side-nav--expanded')}
  aria-label={ariaLabel}>
  <ul class={cx('--side-nav__items')}>
    <slot />
  </ul>
  <footer class={cx('--side-nav__footer')}>
    <button class={cx('--side-nav__toggle')} type="button" title="Open">
      <div class={cx('--side-nav__icon')}>
        <Icon {...closeIcon} />
      </div>
      <span class={cx('--assistive-text')}>{footerSpanText}</span>
    </button>
  </footer>
</nav>
