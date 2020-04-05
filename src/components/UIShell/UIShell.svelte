<script>
  export let uiShellAriaLabel = undefined;
  export let href = undefined;
  export let company = undefined;
  export let platformName = undefined;

  import { cx } from '../../lib';
  import HamburgerMenu from './SideNav/HamburgerMenu.svelte';

  let isSideNavOpen = undefined;
  let winWidth = undefined;
  $: isSideNavOpen = winWidth >= 1056;

  $: ariaLabel = company + (uiShellAriaLabel || $$props['aria-label'] || platformName);
</script>

<svelte:window bind:innerWidth={winWidth} />

<header aria-label={ariaLabel} class={cx('--header')} role="banner">
  {#if winWidth < 1056}
    <HamburgerMenu bind:isOpen={isSideNavOpen} />
  {/if}
  <a class={cx('--header__name')} {href}>
    <span class={cx('--header__name--prefix')}>{company}</span>
    &nbsp;{platformName}
  </a>
  <slot name="Nav" />
  <slot />
  <slot name="SideNav" />
</header>
