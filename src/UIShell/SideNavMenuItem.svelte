<script>
  /** Set to `true` to select the item */
  export let isSelected = false;

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the item text.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { overflowTitle } from "../utils/overflow-title.js";

  let textRef = null;

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
    use:overflowTitle={{
      measure: textRef,
      lazy: true,
      title: $$restProps.title,
    }}
    {...$$restProps}
    on:click
  >
    <span bind:this={textRef} class:bx--side-nav__link-text={true}
      ><slot>{text}</slot></span
    >
  </a>
</li>
