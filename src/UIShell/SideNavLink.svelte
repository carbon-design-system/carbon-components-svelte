<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{}} badge
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
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { uniqueId } from "../utils/unique-id.js";

  const menu = getContext("carbon:SideNavMenu");
  const key = {};

  $: menu?.setCurrent(key, isSelected);

  // A `SideNavFilter` shares its query through the nearest `SideNavItems`.
  // An item reports whether it matches to its parent menu, else to the list.
  const itemsCtx = getContext("carbon:SideNavItems");
  const query = itemsCtx?.query ?? readable("");
  const filterId = uniqueId();

  $: matchText = text ?? ref?.textContent ?? "";
  $: matchResult = fuzzyMatch(matchText, $query);
  $: matches = matchResult.matched;
  $: (menu?.setChildMatch ?? itemsCtx?.setItemMatch)?.(filterId, matches);
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

  onMount(() => () => {
    menu?.setCurrent(key, false);
    (menu?.unregisterChild ?? itemsCtx?.unregisterItem)?.(filterId);
  });
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
    rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
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
    {#if $$slots.badge}
      <div class:bx--side-nav__link-badge={true}><slot name="badge" /></div>
    {/if}
  </a>
</li>
