<script>
  /** Set to `false` to hide the side nav by default */
  export let expandedByDefault = true;

  /** Set to `true` to open the side nav */
  export let isSideNavOpen = false;

  /**
   * Specify the ARIA label for the header.
   * @type {string}
   */
  export let uiShellAriaLabel = undefined;

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the company name.
   *
   * Alternatively, use the named slot "company".
   * @type {string}
   * @example
   * ```svelte
   * <Header>
   *   <span slot="company">IBM</span>
   * </Header>
   * ```
   */
  export let companyName = undefined;

  /**
   * Specify the platform name.
   * Alternatively, use the named slot "platform".
   * @example
   * ```svelte
   * <Header>
   *   <span slot="platform">Platform Name</span>
   * </Header>
   * ```
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
   * - max: 1584.
   */
  export let expansionBreakpoint = 1056;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  /**
   * Specify the icon to render for the closed state.
   * @type {any}
   */
  export let iconMenu = Menu;

  /**
   * Specify the icon to render for the opened state.
   * @type {any}
   */
  export let iconClose = Close;

  /**
   * Specify the ARIA label for the hamburger menu.
   * Defaults to "Open menu" or "Close menu" based on `isSideNavOpen` state.
   * @type {string}
   */
  export let ariaLabelMenu = undefined;

  import Close from "../icons/Close.svelte";
  import Menu from "../icons/Menu.svelte";
  import HamburgerMenu from "./HamburgerMenu.svelte";
  import { shouldRenderHamburgerMenu } from "./navStore";

  /** @type {undefined | number} */
  let winWidth = undefined;
  let wasAboveBreakpoint = undefined;
  let userExplicitlySet = false;

  $: isAboveBreakpoint =
    winWidth !== undefined && winWidth >= expansionBreakpoint;

  // Only auto-set isSideNavOpen on initial mount or when crossing the breakpoint threshold.
  // This prevents mobile browser scroll events (which cause minor width changes
  // due to address bar hide/show) from unexpectedly closing the nav.
  $: {
    const shouldAutoExpand =
      expandedByDefault && isAboveBreakpoint && !persistentHamburgerMenu;

    if (wasAboveBreakpoint === undefined) {
      // Initial mount: set based on current viewport
      isSideNavOpen = shouldAutoExpand;
    } else if (wasAboveBreakpoint !== isAboveBreakpoint) {
      // Crossed breakpoint threshold - reset user flag and auto-expand if appropriate
      userExplicitlySet = false;
      isSideNavOpen = shouldAutoExpand;
    }

    wasAboveBreakpoint = isAboveBreakpoint;
  }

  $: ariaLabel = companyName
    ? companyName
    : `${uiShellAriaLabel || $$props["aria-label"] || platformName}`;
  $: hamburgerAriaLabel =
    ariaLabelMenu ?? (isSideNavOpen ? "Close menu" : "Open menu");
</script>

<svelte:window bind:innerWidth={winWidth} />

<header aria-label={ariaLabel} class:bx--header={true}>
  <slot name="skipToContent" />
  {#if ($shouldRenderHamburgerMenu && winWidth < expansionBreakpoint) || persistentHamburgerMenu}
    <HamburgerMenu
      bind:isOpen={isSideNavOpen}
      on:click={() => {
        userExplicitlySet = true;
      }}
      {iconClose}
      {iconMenu}
      ariaLabel={hamburgerAriaLabel}
    />
  {/if}
  <a
    {href}
    class:bx--header__name={true}
    bind:this={ref}
    {...$$restProps}
    on:click
  >
    {#if companyName || $$slots.company}
      <span class:bx--header__name--prefix={true}
        ><slot name="company">{companyName}&nbsp;</slot></span
      >
    {/if}
    <slot name="platform">{platformName}</slot>
  </a>
  <slot />
</header>
