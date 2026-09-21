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
  import { fuzzyMatch, highlightSegmentsToHtml } from "../utils/fuzzy-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  const filterCtx = getContext("carbon:SideNavItems");
  const { query, setItemMatch, unregisterItem } = filterCtx ?? {
    query: readable(""),
    setItemMatch: () => {},
    unregisterItem: () => {},
  };
  const id = uniqueId();

  $: matchText = text ?? ref?.textContent ?? "";
  $: matchResult = fuzzyMatch(matchText, $query);
  $: matches = matchResult.matched;
  $: setItemMatch(id, matches);
  $: hiddenByFilter = $query.length > 0 && !matches;

  // Highlighting only applies to the plain `text` prop; a custom default
  // slot is rendered as-is.
  $: labelHtml =
    text && !$$slots.default && $query.length > 0
      ? highlightSegmentsToHtml(
          text,
          matchResult.indices,
          "bx--side-nav-filter__highlight",
        )
      : null;

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
    <span class:bx--side-nav__link-text={true}>
      {#if labelHtml}
        {@html labelHtml}
      {:else}
        <slot> {text} </slot>
      {/if}
    </span>
  </a>
</li>
