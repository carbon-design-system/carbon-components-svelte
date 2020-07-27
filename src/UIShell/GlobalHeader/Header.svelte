<script>
  /**
   * Set to `true` to open the side nav
   * @type {boolean} [isSideNavOpen=false]
   */
  export let isSideNavOpen = false;

  /**
   * Specify the ARIA label for the header
   * @type {string} [uiShellAriaLabel]
   */
  export let uiShellAriaLabel = undefined;

  /**
   * Specify the `href` attribute
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Specify the company name
   * @type {string} [company]
   */
  export let company = undefined;

  /**
   * Specify the platform name
   * @type {string} [platformName]
   */
  export let platformName = undefined;

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
