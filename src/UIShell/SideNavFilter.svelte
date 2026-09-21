<script>
  /**
   * @event {null} clear
   * @slot {{}} noResults
   */

  /**
   * Specify the filter input value.
   * @bindable writable
   */
  export let value = "";

  /** Specify the `placeholder` attribute of the filter input. */
  export let placeholder = "Filter...";

  /** Specify the label text for the filter input. */
  export let labelText = "Filter";

  /** Specify the label for the clear button. */
  export let closeButtonLabelText = "Clear filter";

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import Search from "../Search/Search.svelte";
  import { isSideNavCollapsed, isSideNavRail } from "./nav-store.js";

  const filterCtx = getContext("carbon:SideNavItems");
  const { query, hasVisibleItems, registerFilter, focusEdge } = filterCtx ?? {
    query: null,
    hasVisibleItems: readable(true),
    registerFilter: () => () => {},
    focusEdge: () => {},
  };

  onMount(() => registerFilter());

  // Rail mode collapses the nav to icons only; there is no room for a
  // filter input and, once collapsed, nothing to type a filter against.
  $: hideForRail = $isSideNavRail && $isSideNavCollapsed;

  $: if (query) query.set(value);
  $: showNoResults = value.length > 0 && !$hasVisibleItems;

  function handleKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusEdge(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusEdge(-1);
    }
  }
</script>

{#if !hideForRail}
  <li class:bx--side-nav-filter={true}>
    <Search
      bind:value
      size="sm"
      {placeholder}
      {labelText}
      {closeButtonLabelText}
      on:keydown={handleKeydown}
      on:clear
    />
    {#if showNoResults}
      <div class:bx--side-nav-filter__no-results={true}>
        <slot name="noResults">No results found</slot>
      </div>
    {/if}
  </li>
{/if}
