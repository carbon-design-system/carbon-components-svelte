<script>
  /**
   * @template [Icon=any]
   */

  /** Set to `true` to select the current link */
  export let isSelected = false;

  /** Set to `true` to use the large variant */
  export let large = false;

  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

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
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { fuzzyMatch } from "../utils/fuzzy-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  const filterCtx = getContext("carbon:SideNavItems");
  const { query, setItemMatch, unregisterItem } = filterCtx ?? {
    query: readable(""),
    setItemMatch: () => {},
    unregisterItem: () => {},
  };
  const id = uniqueId();

  $: matchText = text ?? ref?.textContent ?? "";
  $: matches = fuzzyMatch(matchText, $query).matched;
  $: setItemMatch(id, matches);
  $: hiddenByFilter = $query.length > 0 && !matches;

  onMount(() => () => unregisterItem(id));
</script>

<li
  hidden={hiddenByFilter || undefined}
  class:bx--side-nav__item={true}
  class:bx--side-nav__item--large={large}
>
  <a
    bind:this={ref}
    aria-current={isSelected ? "page" : undefined}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    class:bx--side-nav__link={true}
    class:bx--side-nav__link--current={isSelected}
    {...$$restProps}
    on:click
  >
    {#if $$slots.icon || icon}
      <div
        class:bx--side-nav__icon={true}
        class:bx--side-nav__icon--small={true}
      >
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    <span class:bx--side-nav__link-text={true}> <slot> {text} </slot> </span>
  </a>
</li>
