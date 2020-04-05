<script>
  export let href = undefined;
  export let text = undefined;
  import { cx } from '../../../lib';
</script>

<li>
  <a
    class={cx('--header__menu-item')}
    role="menuitem"
    tabindex="0"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:focus
    on:blur
    {href}>
    <span class={cx('--text-truncate--end')}>{text}</span>
  </a>
</li>
