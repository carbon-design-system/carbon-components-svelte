<script>
  export let ariaLabel = undefined;

  import { cx } from '../../../lib';
</script>

<nav class={cx('--side-nav__navigation', '--side-nav', '--side-nav--ux')} aria-label={ariaLabel}>
  <ul class={cx('--side-nav__items')}>
    <slot />
  </ul>
  <footer class="bx--side-nav__footer">
    <button class="bx--side-nav__toggle" type="button" title="Open">
      <div class="bx--side-nav__icon">
        <svg
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 32 32"
          aria-hidden="true"
          style="will-change: transform;">
          <path d="M22 16L12 26l-1.4-1.4 8.6-8.6-8.6-8.6L12 6z" />
        </svg>
      </div>
      <span class="bx--assistive-text">Open</span>
    </button>
  </footer>
</nav>
