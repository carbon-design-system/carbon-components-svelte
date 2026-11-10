<script>
  /**
   * @typedef {import("./filter-model.js").Facet} Facet
   * @typedef {import("./filter-model.js").FilterState} FilterState
   * @typedef {import("./filter-model.js").AppliedFilter} AppliedFilter
   * @event {FilterState} change - Fires with the filters after a chip is removed or Clear all is pressed.
   * @event {null} clear - Fires when Clear all empties the filters.
   * @restProps {div}
   */

  /**
   * Specify the facets, as given to `FilterPanel`.
   * @type {ReadonlyArray<Facet>}
   */
  export let facets = [];

  /**
   * The applied filters, by facet id.
   * @type {FilterState}
   * @bindable writable
   */
  export let value = {};

  /** Specify the group's accessible name. */
  export let labelText = "Applied filters";

  /** Specify the text of the button that empties the filters. */
  export let clearAllText = "Clear all";

  /** Specify the text a screen reader hears when no filter is applied. */
  export let emptyText = "No filters applied";

  /**
   * Specify the accessible name lead of a chip's remove button: "Remove filter Brand: Acme".
   */
  export let removeText = "Remove filter";

  /**
   * Specify how a range reads in its chip.
   * @type {((facet: import("./filter-model.js").RangeFacet, lo: number | null, hi: number | null) => string) | undefined}
   */
  export let rangeText = undefined;

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Tag from "../Tag/Tag.svelte";
  import {
    appliedFilters,
    normalizeFilterState,
    removeApplied,
  } from "./filter-model.js";

  const dispatch = createEventDispatcher();

  $: chips = appliedFilters(facets, normalizeFilterState(facets, value), {
    range: rangeText,
  });

  /**
   * Remove a chip and keep focus in the bar: on the chip that took its place,
   * or the one before it, or the bar itself once none is left.
   * @param {AppliedFilter} chip
   * @param {number} index
   */
  async function remove(chip, index) {
    value = removeApplied(facets, value, chip);
    dispatch("change", value);
    await tick();
    const buttons = ref?.querySelectorAll("button.bx--tag__close-icon");
    const next = buttons?.[Math.min(index, buttons.length - 1)];
    if (next instanceof HTMLElement) next.focus();
    else ref?.focus();
  }

  async function clearAll() {
    value = {};
    dispatch("change", value);
    dispatch("clear", null);
    await tick();
    ref?.focus();
  }
</script>

<div
  bind:this={ref}
  role="group"
  aria-label={labelText}
  tabindex="-1"
  {...$$restProps}
  class:bx--filter-panel__applied={true}
  class:bx--filter-panel__applied--empty={chips.length === 0}
>
  {#if chips.length > 0}
    <ul class="bx--filter-panel__chips">
      {#each chips as chip, index (`${chip.facetId}:${chip.optionId ?? ""}`)}
        <li>
          <Tag
            filter
            type="high-contrast"
            title={removeText}
            on:close={() => remove(chip, index)}
          >
            {chip.label}
          </Tag>
        </li>
      {/each}
    </ul>
    <Button kind="ghost" size="sm" on:click={clearAll}>{clearAllText}</Button>
  {:else}
    <span class="bx--visually-hidden">{emptyText}</span>
  {/if}
</div>
