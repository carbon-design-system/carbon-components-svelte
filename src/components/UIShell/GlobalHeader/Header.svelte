<script>
  export let uiShellAriaLabel = undefined;
  export let href = undefined;
  export let company = undefined;
  export let platformName = undefined;
  export let isSideNavOpen = undefined;

  import { cx } from '../../../lib';
  import HamburgerMenu from '../SideNav/HamburgerMenu.svelte';

  let winWidth = undefined;
  $: isSideNavOpen = winWidth >= 1056;

  $: ariaLabel = company + (uiShellAriaLabel || $$props['aria-label'] || platformName);
</script>

<svelte:window bind:innerWidth={winWidth} />

<header aria-label={ariaLabel} class={cx('--header')} role="banner">
  {#if winWidth < 1056}
    <HamburgerMenu bind:isOpen={isSideNavOpen} />
  {/if}
  <a class={cx('--header__name')} {href} on:click>
    <span class={cx('--header__name--prefix')}>{company}</span>
    &nbsp;{platformName}
  </a>
  <slot />
</header>
