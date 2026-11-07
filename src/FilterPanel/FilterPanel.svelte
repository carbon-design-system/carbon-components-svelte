<script>
  /**
   * @typedef {import("./filter-model.js").Facet} Facet
   * @typedef {import("./filter-model.js").FilterState} FilterState
   * @typedef {import("./filter-model.js").FacetCounts} FacetCounts
   * @event {FilterState} change - Fires with the applied filters. In `instant` mode on every edit; in `batch` mode when Apply is pressed.
   * @event {FilterState} input - Fires with the draft on every edit, in both modes.
   * @event {FilterState} apply - Fires in `batch` mode when Apply is pressed, after `change`.
   * @event {FilterState} reset - Fires in `batch` mode when Reset puts the draft back to the applied filters.
   * @event {null} clear - Fires when Clear all empties the filters.
   * @restProps {div}
   */

  /**
   * Specify the facets. Each has an `id`, a `label` and a `type`: `"checkbox"`,
   * `"radio"`, `"range"`, `"date"`, `"toggle"` or `"tree"`. A `checkbox`,
   * `radio` or `tree` facet lists its `options`; use `deriveFacetOptions` to
   * read them from the records.
   * @type {ReadonlyArray<Facet>}
   */
  export let facets = [];

  /**
   * The applied filters, by facet id. A facet with no filter has no key.
   * @type {FilterState}
   * @bindable writable
   */
  export let value = {};

  /**
   * The filters as the controls show them. It equals `value` in `instant`
   * mode, and runs ahead of it in `batch` mode until Apply. Compute counts
   * from it to preview the result before it is applied.
   * @type {FilterState}
   * @bindable readonly
   */
  export let draft = {};

  /**
   * The number of records each option would show, by facet id and option id:
   * `{ brand: { acme: 12 } }`. Compute it with `facetCounts`, or pass what a
   * server returned. Without it, no count shows.
   * @type {FacetCounts | undefined}
   */
  export let counts = undefined;

  /**
   * The number of results the filters leave. It shows beside the title, and a
   * polite status region says it once it stops changing.
   * @type {number | undefined}
   */
  export let resultCount = undefined;

  /**
   * Set when edits apply. `"instant"` applies each edit. `"batch"` waits for
   * Apply, so a server is asked once.
   * @type {"instant" | "batch"}
   */
  export let mode = "instant";

  /**
   * Set what an option with no results does. `"disable"` keeps it in place
   * and dims it, `"hide"` removes it. A checked option always stays.
   * @type {"disable" | "hide"}
   */
  export let zeroCounts = "disable";

  /** Specify the heading. */
  export let title = "Filters";

  /** Set to `true` to hide the heading and the result count. */
  export let hideTitle = false;

  /** Set to `true` to hide the visible result count. The status region still speaks it. */
  export let hideResultCount = false;

  /** Specify the quiet time in milliseconds before the status region says a new result count. */
  export let announceDelay = 800;

  /** Specify the text of the button that empties the filters. */
  export let clearAllText = "Clear all";

  /** Specify the text of the `batch` mode button that applies the draft. */
  export let applyText = "Apply";

  /** Specify the text of the `batch` mode button that discards the draft. */
  export let resetText = "Reset";

  /** Specify the text of a radio facet's option that clears it. */
  export let anyText = "Any";

  /** Specify the label of a date facet's first input. */
  export let fromText = "From";

  /** Specify the label of a date facet's second input. */
  export let toText = "To";

  /** Specify the label of a range facet's lower input. */
  export let minText = "Min";

  /** Specify the label of a range facet's upper input. */
  export let maxText = "Max";

  /** Specify the format of a date facet. It must parse back to `YYYY-MM-DD`: keep `Y-m-d`. */
  export let dateFormat = "Y-m-d";

  /**
   * Specify the result count text. It is spoken too.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /**
   * Specify the label of a facet's in-list search.
   * @type {(facetLabel: string) => string}
   */
  export let searchLabelText = defaultSearchLabel;

  /**
   * Specify the text of the button that expands a long list.
   * @type {(hidden: number) => string}
   */
  export let showMoreText = defaultShowMore;

  /** Specify the text of the button that collapses an expanded list. */
  export let showLessText = "Show less";

  /** Specify the text when a facet's search finds nothing. */
  export let noResultsText = "No matching options";

  /**
   * Specify the text when a list is cut at its render limit.
   * @type {(shown: number, total: number) => string}
   */
  export let truncatedText = defaultTruncated;

  /**
   * Specify the most options a facet draws at once. Search narrows the rest.
   */
  export let maxOptions = 100;

  /**
   * Specify the accessible name of the applied-count badge on a facet's header.
   * @type {(count: number) => string}
   */
  export let appliedText = defaultApplied;

  /** Set an id. Inner ids derive from it. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /** @param {number} count */
  function defaultResultsText(count) {
    return `${count.toLocaleString("en")} ${count === 1 ? "result" : "results"}`;
  }

  /** @param {string} label */
  function defaultSearchLabel(label) {
    return `Search ${label}`;
  }

  /** @param {number} hidden */
  function defaultShowMore(hidden) {
    return `Show ${hidden} more`;
  }

  /**
   * @param {number} shown
   * @param {number} total
   */
  function defaultTruncated(shown, total) {
    return `Showing ${shown} of ${total}. Search to narrow the list.`;
  }

  /** @param {number} count */
  function defaultApplied(count) {
    return `${count} applied`;
  }

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Accordion from "../Accordion/Accordion.svelte";
  import AccordionItem from "../Accordion/AccordionItem.svelte";
  import Button from "../Button/Button.svelte";
  import { deepEqual } from "../utils/deep-equal.js";
  import { uniqueId } from "../utils/unique-id.js";
  import FilterFacet from "./FilterFacet.svelte";
  import {
    countFilters,
    isFilterActive,
    normalizeFacetValue,
    normalizeFilterState,
  } from "./filter-model.js";
  import { createResultAnnouncer } from "./result-announcer.js";

  const dispatch = createEventDispatcher();

  // Inside a flyout, the side panel's title is the heading.
  /** @type {import("svelte/store").Readable<boolean> | undefined} */
  const inFlyout = getContext("carbon:FilterFlyout");

  /** @type {FilterState} */
  let applied = normalizeFilterState(facets, value);
  draft = applied;

  // A `value` set from outside replaces the draft too. A write the panel made
  // itself arrives equal to `applied` and falls through.
  /**
   * @param {FilterState} next
   * @param {ReadonlyArray<Facet>} schema
   */
  function syncValue(next, schema) {
    const normalized = normalizeFilterState(schema, next);
    if (deepEqual(normalized, applied)) return;
    applied = normalized;
    draft = normalized;
  }
  $: syncValue(value, facets);

  function apply() {
    applied = draft;
    value = draft;
    dispatch("change", draft);
  }

  /**
   * @param {string} facetId
   * @param {unknown} next
   */
  function setFacet(facetId, next) {
    const facet = facets.find((f) => f.id === facetId);
    if (!facet) return;
    const normalized = normalizeFacetValue(facet, next);
    // A group that is handed a new `selected` echoes it back as a change.
    if (deepEqual(normalized, draft[facetId])) return;
    const rest = { ...draft };
    if (normalized === undefined) delete rest[facetId];
    else rest[facetId] = normalized;
    draft = rest;
    dispatch("input", draft);
    if (mode === "instant") apply();
  }

  function clearAll() {
    if (count === 0) return;
    draft = {};
    dispatch("input", draft);
    if (mode === "instant") apply();
    dispatch("clear", null);
  }

  function applyDraft() {
    apply();
    dispatch("apply", draft);
  }

  function resetDraft() {
    draft = applied;
    dispatch("input", draft);
    dispatch("reset", draft);
  }

  /** @param {Facet} facet */
  function optionsOf(facet) {
    return "options" in facet && facet.options ? facet.options : [];
  }

  $: count = countFilters(facets, draft);
  $: texts = {
    searchLabel: searchLabelText,
    showMore: showMoreText,
    showLess: showLessText,
    noResults: noResultsText,
    capped: truncatedText,
  };

  const announcer = createResultAnnouncer(resultCount, announceDelay);
  $: announcer.track(resultCount, resultsText);
  onMount(() => announcer.cancel);

  $: titleId = `${id}-title`;
</script>

<div
  bind:this={ref}
  {id}
  role="group"
  aria-label={title}
  {...$$restProps}
  class:bx--filter-panel={true}
  class:bx--filter-panel--batch={mode === "batch"}
>
  {#if !hideTitle}
    <div class="bx--filter-panel__header">
      {#if !$inFlyout}
        <h2 id={titleId} class="bx--filter-panel__title">{title}</h2>
      {/if}
      {#if resultCount !== undefined && !hideResultCount}
        <p class="bx--filter-panel__results" aria-hidden="true">
          {resultsText(resultCount)}
        </p>
      {/if}
    </div>
  {/if}
  <div class="bx--filter-panel__toolbar">
    <Button
      kind="ghost"
      size="sm"
      class="bx--filter-panel__clear {count === 0 ? 'bx--btn--disabled' : ''}"
      aria-disabled={count === 0 ? "true" : undefined}
      on:click={clearAll}
    >
      {clearAllText}
    </Button>
  </div>
  <div class="bx--filter-panel__body">
    <Accordion align="start" size="md">
      {#each facets as facet (facet.id)}
        {@const appliedCount = isFilterActive(facet, draft[facet.id])
          ? Array.isArray(draft[facet.id])
            ? /** @type {unknown[]} */ (draft[facet.id]).length
            : 1
          : 0}
        <AccordionItem open={!facet.collapsed}>
          <svelte:fragment slot="title">
            <span class="bx--filter-panel__facet-title">
              <span>{facet.label}</span>
              {#if appliedCount > 0}
                <span class="bx--filter-panel__badge"
                  ><span aria-hidden="true">{appliedCount}</span><span
                    class="bx--visually-hidden"
                    >{appliedText(appliedCount)}</span
                  ></span
                >
              {/if}
            </span>
          </svelte:fragment>
          <FilterFacet
            {facet}
            id="{id}-{facet.id}"
            value={draft[facet.id]}
            counts={counts?.[facet.id]}
            options={optionsOf(facet)}
            {zeroCounts}
            {anyText}
            {fromText}
            {toText}
            {minText}
            {maxText}
            {dateFormat}
            {texts}
            cap={maxOptions}
            on:change={(event) => setFacet(facet.id, event.detail)}
          />
        </AccordionItem>
      {/each}
    </Accordion>
  </div>
  {#if mode === "batch"}
    <div class="bx--filter-panel__footer">
      <Button kind="secondary" on:click={resetDraft}>{resetText}</Button>
      <Button on:click={applyDraft}>{applyText}</Button>
    </div>
  {/if}
  <div class="bx--visually-hidden" role="status">{$announcer}</div>
</div>
