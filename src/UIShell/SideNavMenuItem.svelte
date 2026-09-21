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
  import { readable } from "svelte/store";
  import { fuzzyMatch } from "../utils/fuzzy-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  const menuCtx = getContext("carbon:SideNavMenu");
  const { query, setChildMatch, unregisterChild } = menuCtx ?? {
    query: readable(""),
    setChildMatch: () => {},
    unregisterChild: () => {},
  };
  const id = uniqueId();

  $: matchText = text ?? ref?.textContent ?? "";
  $: matches = fuzzyMatch(matchText, $query).matched;
  $: setChildMatch(id, matches);
  $: hiddenByFilter = $query.length > 0 && !matches;

  onMount(() => () => unregisterChild(id));
</script>

<li hidden={hiddenByFilter || undefined} class:bx--side-nav__menu-item={true}>
  <a
    bind:this={ref}
    aria-current={isSelected ? "page" : undefined}
    {href}
    class:bx--side-nav__link={true}
    class:bx--side-nav__link--current={isSelected}
    {...$$restProps}
    on:click
  >
    <span class:bx--side-nav__link-text={true}><slot>{text}</slot></span>
  </a>
</li>
