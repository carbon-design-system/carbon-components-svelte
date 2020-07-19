<script>
  export let uiShellAriaLabel = undefined;
  export let href = undefined;
  export let company = undefined;
  export let platformName = undefined;
  export let isSideNavOpen = undefined;

  import HamburgerMenu from "../SideNav/HamburgerMenu.svelte";

  let winWidth = undefined;

  $: isSideNavOpen = winWidth >= 1056;
  $: ariaLabel =
    company + (uiShellAriaLabel || $$props["aria-label"] || platformName);
</script>

<svelte:window bind:innerWidth={winWidth} />

<header role="banner" aria-label={ariaLabel} class:bx--header={true}>
  {#if winWidth < 1056}
    <HamburgerMenu bind:isOpen={isSideNavOpen} />
  {/if}
  <a {href} class:bx--header__name={true} {...$$restProps} on:click>
    <span class:bx--header__name--prefix={true}>{company}</span>
    &nbsp;{platformName}
  </a>
  <slot />
</header>
