<script>
  /** Set to `false` to hide the side nav by default */
  export let expandedByDefault = true;

  /** Set to `true` to open the side nav */
  export let isSideNavOpen = false;

  /**
   * Specify the ARIA label for the header
   * @type {string}
   */
  export let uiShellAriaLabel = undefined;

  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

   /**
   * Specify the company name.  
   * Alternatively, use the named slot "company" (e.g., `<span slot="company">...</span>`)
   * @type {string}
   */
  export let company = undefined;

  /**
   * Specify the platform name.
   * Alternatively, use the named slot "platform" (e.g., `<span slot="platform">...</span>`)
   */
  export let platformName = "";

  /** Set to `true` to persist the hamburger menu */
  export let persistentHamburgerMenu = false;

  /**
   * The window width (px) at which the SideNav is expanded and the hamburger menu is hidden.
   * 1056 represents the "large" breakpoint in pixels from the Carbon Design System:
   * - small: 320
   * - medium: 672
   * - large: 1056
   * - x-large: 1312
   * - max: 1584
   */
  export let expansionBreakpoint = 1056;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  /**
   * Specify the icon to render for the closed state.
   * Defaults to `<Menu size={20} />`
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let iconMenu = Menu;

  /**
   * Specify the icon to render for the opened state.
   * Defaults to `<Close size={20} />`
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let iconClose = Close;

  import Close from "../icons/Close.svelte";
  import Menu from "../icons/Menu.svelte";
  import { shouldRenderHamburgerMenu } from "./navStore";
  import HamburgerMenu from "./HamburgerMenu.svelte";

  let winWidth = undefined;

  $: isSideNavOpen =
    expandedByDefault &&
    winWidth >= expansionBreakpoint &&
    !persistentHamburgerMenu;
  $: ariaLabel = company
    ? `${company} `
    : "" + (uiShellAriaLabel || $$props["aria-label"] || platformName);
</script>

<svelte:window bind:innerWidth="{winWidth}" />

<header aria-label="{ariaLabel}" class:bx--header="{true}">
  <slot name="skip-to-content" />
  {#if ($shouldRenderHamburgerMenu && winWidth < expansionBreakpoint) || persistentHamburgerMenu}
    <HamburgerMenu
      bind:isOpen="{isSideNavOpen}"
      iconClose="{iconClose}"
      iconMenu="{iconMenu}"
    />
  {/if}
  <a
    href="{href}"
    class:bx--header__name="{true}"
    bind:this="{ref}"
    {...$$restProps}
    on:click
  >
    {#if company || $$slots.company}
      <span class:bx--header__name--prefix="{true}"
        ><slot name="company">{company}&nbsp;</slot></span
      >
    {/if}
    <slot name="platform">{platformName}</slot>
  </a>
  <slot />
</header>
