<script>
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
   * @type {any}
   */
  export let icon = undefined;

  /**
   * Specify the icon rendered after the label, for example an external-link affordance.
   * @type {any}
   */
  export let iconRight = undefined;

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
  export let id = `ccs-${Math.random().toString(36)}`;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { highlightSegments } from "../utils/fuzzyMatch.js";

  const dispatch = createEventDispatcher();
  const menu = getContext("carbon:SearchMenu");
  const group = getContext("carbon:SearchMenuGroup");

  if (!menu) {
    throw new Error("SearchMenuItem must be used within a SearchMenu.");
  }

  const queryStore = menu.query;
  const shouldFilterStore = menu.shouldFilter;
  const matchStore = menu.match;
  const activeIdStore = menu.activeId;
  const groupFilterStore = group?.filter ?? readable(undefined);

  let ref = null;
  let registered = false;

  $: effectiveFilter = filter ?? $groupFilterStore ?? $shouldFilterStore;
  $: matchResult = text
    ? normalizeMatch($matchStore(text, $queryStore))
    : { matched: true, indices: [] };
  $: isFilterable = Boolean(text) && effectiveFilter && !persistent;
  $: shouldRender =
    !text || persistent || !effectiveFilter || matchResult.matched;
  $: highlighted = $activeIdStore === id;
  $: segments = text ? highlightSegments(text, matchResult.indices) : [];
  $: labelHtml = text ? segmentsToHtml(segments) : "";

  $: inDividerGroup = group?.divider ?? false;
  $: updateRegistration(shouldRender, isFilterable, inDividerGroup);

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

  /**
   * Tolerate custom matchers that omit `indices` so highlighting still works.
   */
  function normalizeMatch(result) {
    return {
      matched: Boolean(result?.matched),
      indices: result?.indices ?? [],
    };
  }

  function escapeHtml(raw) {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function segmentsToHtml(parts) {
    // Build the highlighted label as one HTML string. Rendering matched and
    // unmatched runs as separate template nodes pads the text with the
    // whitespace Svelte inserts between siblings, which corrupts the word.
    return parts
      .map((part) =>
        part.match
          ? `<strong class="bx--search-menu-item__highlight">${escapeHtml(part.text)}</strong>`
          : escapeHtml(part.text),
      )
      .join("");
  }

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

  $: if (highlighted && ref && !ref.matches(":hover")) {
    ref.scrollIntoView({ block: "nearest" });
  }
</script>

{#if shouldRender}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svelte:element
    this={href ? "a" : "div"}
    bind:this={ref}
    {id}
    href={href || undefined}
    role="option"
    tabindex="-1"
    aria-selected={highlighted}
    aria-disabled={disabled || undefined}
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
      if (!disabled) menu.setActiveId(id);
    }}
  >
    {#if icon}
      <span class="bx--search-menu-item__icon">
        <svelte:component this={icon} />
      </span>
    {/if}
    <span class="bx--search-menu-item__label">
      {#if $$slots.default}
        <slot
          query={$queryStore}
          matched={matchResult.matched}
          indices={matchResult.indices}
          {segments}
        />
      {:else}
        {@html labelHtml}
      {/if}
    </span>
    {#if iconRight}
      <span
        class="bx--search-menu-item__icon bx--search-menu-item__icon--right"
      >
        <svelte:component this={iconRight} />
      </span>
    {/if}
  </svelte:element>
{/if}
