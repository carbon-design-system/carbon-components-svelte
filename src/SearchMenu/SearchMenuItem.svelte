<script context="module">
  import { indicesToRanges } from "../utils/text-match.js";

  /**
   * Tolerate custom matchers that omit `indices` so highlighting still works,
   * and accept `ranges` in place of them.
   * @param {{ matched?: boolean; indices?: number[]; ranges?: Array<{ start: number; end: number }> } | null | undefined} result
   */
  function normalizeMatch(result) {
    const ranges = result?.ranges ?? indicesToRanges(result?.indices);
    return {
      matched: Boolean(result?.matched),
      // The `indices` slot prop lists every highlighted character.
      indices:
        result?.indices ??
        ranges.flatMap((r) =>
          Array.from({ length: r.end - r.start }, (_, i) => r.start + i),
        ),
      ranges,
    };
  }
</script>

<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @template {import("../utils/icon-component.js").IconComponent} [IconRight=any]
   */

  /**
   * @event {{ value: string; item: { text?: string; value?: string; href?: string }; event: Event }} select
   * @slot {{ query: string; matched: boolean; indices: number[]; segments: Array<{ text: string; match: boolean }> }}
   */

  /**
   * Specify the result label. The portion matching the search value is highlighted.
   * Omit `text` and use the default slot to render custom content.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the value emitted on selection. Defaults to `text`.
   * @type {string | undefined}
   */
  export let value = undefined;

  /**
   * Render the item as a link with this `href`.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the icon rendered before the label.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify the icon rendered after the label, for example an external-link affordance.
   * @type {IconRight | undefined}
   */
  export let iconRight = /** @type {IconRight | undefined} */ (undefined);

  /** Set to `true` to disable the item */
  export let disabled = false;

  /**
   * Set to `true` to always render the item, bypassing fuzzy filtering.
   * Use for persistent rows like footer "Search X in Y" actions.
   */
  export let persistent = false;

  /**
   * Override whether this item is filtered by the search value.
   * Defaults to the group's `filter`, then the menu's `shouldFilter`.
   * @type {boolean | undefined}
   */
  export let filter = undefined;

  /** Set an id for the item element */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import Highlight from "../Highlight/Highlight.svelte";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import { normalizeRanges, splitByRanges } from "../utils/text-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const menu = getContext("carbon:SearchMenu");
  const group = getContext("carbon:SearchMenuGroup");

  if (!menu) {
    throw new Error("SearchMenuItem must be used within a SearchMenu.");
  }

  const query = menu.query;
  const shouldFilter = menu.shouldFilter;
  const match = menu.match;
  const highlightedId = menu.highlightedId;
  const groupFilter = group?.filter ?? readable(undefined);

  /** @type {null | HTMLAnchorElement | HTMLDivElement} */
  let ref = null;
  let registered = false;

  $: effectiveFilter = filter ?? $groupFilter ?? $shouldFilter;
  $: matchResult = text
    ? normalizeMatch($match(text, $query))
    : { matched: true, indices: [], ranges: [] };
  $: isFilterable = Boolean(text) && effectiveFilter && !persistent;
  $: shouldRender =
    !text || persistent || !effectiveFilter || matchResult.matched;
  $: highlighted = $highlightedId === id;
  // Whole characters only: a range that cuts an emoji or a letter and its
  // marks grows to cover it. The slot reads the runs; the fallback markup reads
  // the ranges.
  $: ranges = text ? normalizeRanges(text, matchResult.ranges) : [];
  $: segments = text && $$slots.default ? splitByRanges(text, ranges) : [];

  $: inDividerGroup = group?.divider ?? false;
  $: updateRegistration(shouldRender, isFilterable, inDividerGroup);

  /**
   * @param {boolean} render
   * @param {boolean} filterable
   * @param {boolean} footerGroup
   */
  function updateRegistration(render, filterable, footerGroup) {
    if (render) {
      registered = true;
      menu.registerItem(id, filterable, footerGroup);
      group?.registerItem(id);
    } else if (registered) {
      registered = false;
      menu.unregisterItem(id);
      group?.unregisterItem(id);
    }
  }

  onMount(() => () => updateRegistration(false, false, false));

  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const detail = {
      value: value ?? text ?? "",
      item: { text, value: value ?? text, href },
      event,
    };
    dispatch("select", detail);
    menu.selectItem(detail);
  }

  $: if (shouldRender && highlighted && ref && !ref.matches(":hover")) {
    scrollIntoViewWithin(ref);
  }
</script>

<svelte:element
  this={href ? "a" : "div"}
  bind:this={ref}
  {id}
  href={href || undefined}
  hidden={shouldRender ? undefined : true}
  role="option"
  tabindex="-1"
  aria-selected={highlighted ? "true" : "false"}
  aria-disabled={disabled ? "true" : undefined}
  data-search-menu-filterable={isFilterable || undefined}
  class:bx--search-menu-item={true}
  class:bx--search-menu-item--highlighted={highlighted}
  class:bx--search-menu-item--disabled={disabled}
  class:bx--search-menu-item--link={Boolean(href)}
  {...$$restProps}
  on:click
  on:click={handleClick}
  on:mousedown|preventDefault
  on:mouseenter={() => {
    if (!disabled && shouldRender) menu.setActiveId(id);
  }}
  on:mouseleave={() => {
    if ($highlightedId === id) menu.setActiveId(null);
  }}
>
  {#if icon}
    <span class:bx--search-menu-item__icon={true}>
      <svelte:component this={icon} />
    </span>
  {/if}
  <span class:bx--search-menu-item__label={true}>
    {#if $$slots.default}
      <slot
        query={$query}
        matched={matchResult.matched}
        indices={matchResult.indices}
        {segments}
      />
    {:else}
      <Highlight
        {text}
        {ranges}
        variant="bold"
        markClass="bx--search-menu-item__highlight"
      />
    {/if}
  </span>
  {#if iconRight}
    <span
      class:bx--search-menu-item__icon={true}
      class:bx--search-menu-item__icon--right={true}
    >
      <svelte:component this={iconRight} />
    </span>
  {/if}
</svelte:element>
