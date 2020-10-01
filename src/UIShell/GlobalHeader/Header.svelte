<script>
  /**
   * Set to `false` to hide the side nav by default
   * @type {boolean} [expandedByDefault=true]
   */
  export let expandedByDefault = true;

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
   * Alternatively, use the named slot "platform" (e.g. <span slot="platform">...</span>)
   * @type {string} [platformName]
   */
  export let platformName = undefined;

  /**
   * Obtain a reference to the HTML anchor element
   * @type {null | HTMLAnchorElement} [ref=null]
   */
  export let ref = null;

  import HamburgerMenu from "../SideNav/HamburgerMenu.svelte";

  let winWidth = undefined;

  $: isSideNavOpen = expandedByDefault && winWidth >= 1056;
  $: ariaLabel = company
    ? `${company} `
    : "" + (uiShellAriaLabel || $$props["aria-label"] || platformName);
</script>

<svelte:window bind:innerWidth="{winWidth}" />

<header role="banner" aria-label="{ariaLabel}" class:bx--header="{true}">
  <slot name="skip-to-content" />
  {#if winWidth < 1056}
    <HamburgerMenu bind:isOpen="{isSideNavOpen}" />
  {/if}
  <a
    href="{href}"
    class:bx--header__name="{true}"
    bind:this="{ref}"
    {...$$restProps}
    on:click
  >
    {#if company}
      <span class:bx--header__name--prefix="{true}">{company}&nbsp;</span>
    {/if}
    <slot name="platform">{platformName}</slot>
  </a>
  <slot />
</header>
