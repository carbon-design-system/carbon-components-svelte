<script>
  export let href;

  import { cx } from '../../../lib';
</script>

<li class={cx('--switcher__item')}>
  <a class={cx('--switcher__item-link')} {href}>
    <slot />
  </a>
</li>
