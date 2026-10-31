<script>
  /**
   * @slot {{}} badge
   */

  /** Set to `true` to select the item */
  export let isSelected = false;

  /**
   * Specify the `href` attribute.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the item text.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";

  const menu = getContext("carbon:SideNavMenu");
  const key = {};

  $: menu?.setCurrent(key, isSelected);

  onMount(() => () => menu?.setCurrent(key, false));
</script>

<li class:bx--side-nav__menu-item={true}>
  <a
    bind:this={ref}
    aria-current={isSelected ? "page" : undefined}
    {href}
    rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
    class:bx--side-nav__link={true}
    class:bx--side-nav__link--current={isSelected}
    {...$$restProps}
    on:click
  >
    <span class:bx--side-nav__link-text={true}><slot>{text}</slot></span>
    {#if $$slots.badge}
      <div class:bx--side-nav__link-badge={true}><slot name="badge" /></div>
    {/if}
  </a>
</li>
