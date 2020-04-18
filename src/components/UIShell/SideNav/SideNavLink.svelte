<script>
  export let href = undefined;
  export let text = undefined;
  export let icon = undefined;
  export let isSelected = false;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
</script>

<li class={cx('--side-nav__item')}>
  <a
    {href}
    class={cx('--side-nav__link', isSelected && '--side-nav__link--current')}
    aria-current={isSelected ? 'page' : ''}
    on:click>
    <div class={cx('--side-nav__icon', '--side-nav__icon--small')}>
      {#if icon}
        <Icon {...icon} />
      {/if}
    </div>
    <span class={cx('--side-nav__link-text')}>{text}</span>
  </a>
</li>
