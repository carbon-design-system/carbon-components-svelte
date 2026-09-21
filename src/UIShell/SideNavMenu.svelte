<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
  export let expanded = false;

  /** Set to `true` to use the large variant */
  export let large = false;

  /**
   * Specify the text.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the HTML button element.
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { isSideNavCollapsed, isSideNavRail } from "./nav-store.js";

  let menuRef = null;

  $: if ($isSideNavRail && $isSideNavCollapsed) {
    expanded = false;
  }

  onMount(() => {
    if (menuRef?.querySelector('[aria-current="page"]')) {
      expanded = true;
    }
  });
</script>

<li
  class:bx--side-nav__item={true}
  class:bx--side-nav__item--icon={icon}
  class:bx--side-nav__item--large={large}
>
  <button
    type="button"
    bind:this={ref}
    aria-expanded={expanded}
    class:bx--side-nav__submenu={true}
    {...$$restProps}
    on:click
    on:click={() => {
      expanded = !expanded;
    }}
  >
    {#if $$slots.icon || icon}
      <span class:bx--side-nav__icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </span>
    {/if}
    <span class:bx--side-nav__submenu-title={true}>{text}</span>
    <span
      class:bx--side-nav__icon={true}
      class:bx--side-nav__icon--small={true}
      class:bx--side-nav__submenu-chevron={true}
    >
      <ChevronDown />
    </span>
  </button>
  <ul
    bind:this={menuRef}
    inert={expanded ? undefined : "true"}
    class:bx--side-nav__menu={true}
    style:max-height={expanded ? "none" : undefined}
  >
    <slot />
  </ul>
</li>
