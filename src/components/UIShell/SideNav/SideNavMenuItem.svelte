<script>
  export let href = undefined;
  export let text = undefined;
  export let isSelected = undefined;

  import { cx } from '../../../lib';
</script>

<li class={cx('--side-nav__menu-item')} role="none">
  <a
    {href}
    class={cx('--side-nav__link')}
    role="menuitem"
    aria-current={isSelected ? 'page' : ''}
    on:click>
    <span class={cx('--side-nav__link-text')}>{text}</span>
  </a>
</li>
