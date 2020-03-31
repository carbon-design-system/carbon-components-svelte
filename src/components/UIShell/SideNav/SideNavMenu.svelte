<script>
  export let text = undefined;
  export let icon = undefined;
  export let expanded = false;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';

  let iconProps = {
    class: undefined,
    skeleton: false,
    render: ChevronDown16,
    title: 'Open Menu',
    tabindex: '0',
    focusable: false,
    style: undefined
  };
</script>

<li class={cx('--side-nav__item', '--side-nav__item--icon')}>
  <button
    aria-haspopup="true"
    aria-expanded={expanded}
    class={cx('--side-nav__submenu')}
    type="button"
    on:click={() => {
      expanded = !expanded;
    }}>
    <div class={cx('--side-nav__icon')}>
      {#if icon}
        <Icon {...icon} />
      {/if}
    </div>
    <span class={cx('--side-nav__submenu-title')}>{text}</span>
    <div class={cx('--side-nav__icon', '--side-nav__icon--small', '--side-nav__submenu-chevron')}>
      <Icon {...iconProps} />
    </div>
  </button>
  <ul class={cx('--side-nav__menu')} role="menu">
    <slot />
  </ul>
</li>
