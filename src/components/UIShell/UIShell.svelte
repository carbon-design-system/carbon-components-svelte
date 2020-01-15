<script>
  export let uiShellAriaLabel = undefined;
  export let href = undefined;
  export let company = undefined;
  export let platformName = undefined;
  export let navMenu = undefined;
  export let rightPanel = undefined;
  export let sideNavMenu = undefined;

  import { cx } from '../../lib';
  import UIShellNavWrapper from './UIShellNav/UIShellNavWrapper.svelte';
  import UIShellNavItem from './UIShellNav/UIShellNavItem.svelte';
  import UIShellRightPanel from './UIShellRightPanel/UIShellRightPanel.svelte';
  import UIShellSideNavWrapper from './UIShellSideNav/UIShellSideNavWrapper.svelte';
  import UIShellSideNavItem from './UIShellSideNav/UIShellSideNavItem.svelte';
  import HamburgerMenu from './UIShellSideNav/HamburgerMenu.svelte';

  let isSideNavOpen = undefined;
  let winWidth = window.innerWidth;

  window.addEventListener('resize', () => {
    winWidth = window.innerWidth;

    if (winWidth >= 1056) {
      isSideNavOpen = true;
    } else {
      isSideNavOpen = false;
    }
  });

  $: ariaLabel = company + (uiShellAriaLabel || $$props['aria-label'] || platformName);
</script>

<header aria-label={ariaLabel} class={cx('--header')} role="banner">
  {#if winWidth < 1056}
    <HamburgerMenu bind:isOpen={isSideNavOpen} />
  {/if}
  <a class={cx('--header__name')} {href}>
    <span class={cx('--header__name--prefix')}>{company}</span>
    &nbsp;{platformName}
  </a>
  {#if navMenu}
    <UIShellNavWrapper ariaLabel>
      {#each navMenu as itemMenu}
        <UIShellNavItem {...itemMenu} />
      {/each}
    </UIShellNavWrapper>
  {/if}
  {#if rightPanel}
    <UIShellRightPanel {rightPanel} on:inputSearch />
  {/if}
  {#if sideNavMenu}
    <UIShellSideNavWrapper bind:isOpen={isSideNavOpen} bind:winWidth>
      {#each sideNavMenu as itemSideMenu}
        <UIShellSideNavItem {...itemSideMenu} />
      {/each}
    </UIShellSideNavWrapper>
  {/if}
</header>
