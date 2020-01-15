<script>
  export let href = undefined;
  export let text = undefined;
  export let subMenu = undefined;
  export let icon = undefined;
  export let expanded = false;

  import { cx } from '../../../lib';
  import { onDestroy } from 'svelte';
  import Icon from '../../Icon/Icon.svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import isNavItemSelectedStore from './isNavItemSelectedStore';
  import UIShellSideNavSubMenu from './UIShellSideNavSubMenu.svelte';

  let isSelected = undefined;

  const unsubscribe = isNavItemSelectedStore.subscribe(values => {
    values.forEach(item => {
      if (item.id === text) {
        isSelected = item.isSelected;
      }
    });
  });

  let iconProps = {
    class: undefined,
    skeleton: false,
    render: ChevronDown16,
    title: 'Open Menu',
    tabIndex: 0,
    focusable: false,
    style: undefined
  };

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if href}
  <li class={cx('--side-nav__item')}>
    <a
      {href}
      class={cx('--side-nav__link', isSelected && '--side-nav__link--current')}
      aria-current={isSelected ? 'page' : ''}
      on:click={() => isNavItemSelectedStore.setSelected(text)}>
      <div class={cx('--side-nav__icon', '--side-nav__icon--small')}>
        {#if icon}
          <Icon {...icon[0]} />
        {/if}
      </div>
      <span class={cx('--side-nav__link-text')}>{text}</span>
    </a>
  </li>
{:else}
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
        <Icon {...icon[0]} />
      </div>
      <span class={cx('--side-nav__submenu-title')}>{text}</span>
      <div class={cx('--side-nav__icon', '--side-nav__icon--small', '--side-nav__submenu-chevron')}>
        {#if icon}
          <Icon {...iconProps} />
        {/if}
      </div>
    </button>
    <ul class={cx('--side-nav__menu')} role="menu">
      {#each subMenu as menuItem}
        <UIShellSideNavSubMenu {...menuItem} />
      {/each}
    </ul>
  </li>
{/if}
