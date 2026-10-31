<script>
  /**
   * @typedef {"columnSortAscending" | "columnSortDescending"} TableHeaderTranslationId
   */

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /**
   * Specify the sort direction.
   * @type {"none" | "ascending" | "descending"}
   */
  export let sortDirection = "none";

  /** Set to `true` if the column sorting */
  export let active = false;

  /**
   * Specify the `scope` attribute
   * @type {"col" | "row" | "colgroup" | "rowgroup"}
   */
  export let scope = "col";

  /** Default translation ids */
  export const translationIds = /** @type {const} */ ({
    columnSortAscending: "columnSortAscending",
    columnSortDescending: "columnSortDescending",
  });

  /**
   * Override the default translation ids.
   * @type {(id: TableHeaderTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /** Set an id for the top-level element */
  export let id = uniqueId();

  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const defaultTranslations = {
    [translationIds.columnSortAscending]:
      "Sort rows by this header in ascending order",
    [translationIds.columnSortDescending]:
      "Sort rows by this header in descending order",
  };

  $: translationId = active
    ? sortDirection === "descending"
      ? translationIds.columnSortAscending
      : translationIds.columnSortDescending
    : translationIds.columnSortAscending;
  $: ariaLabel =
    translateWithId?.(translationId) ?? defaultTranslations[translationId];

  const tableContext = getContext("carbon:DataTable");

  // Inside a DataTable, an active AI label marks the whole column.
  const setColumnAILabel = tableContext?.setColumnAILabel;

  // In a DataTable with `cellFocus` the header row is part of the grid: its
  // controls take focus from the arrow keys, not from Tab.
  const cellFocus = tableContext?.cellFocus ?? writable(false);
  $: gridTabindex = $cellFocus ? -1 : undefined;

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot. A DataTable
   * fills every header's slot from `headerDecorator`, which can hold a label
   * for some columns only, so it starts unset there.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable(
    $$slots.decorator && !setColumnAILabel ? "active" : undefined,
  );
  $: setColumnAILabel?.(id, $aiLabelState === "active");
  onMount(() => () => setColumnAILabel?.(id, false));
</script>

{#if sortable}
  <th
    {id}
    aria-sort={active ? sortDirection : "none"}
    {scope}
    data-header={id}
    class:bx--table-sort__header--decorator={$$slots.decorator}
    class:bx--table-header--ai-label={$aiLabelState === "active"}
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.decorator}
      <div class:bx--table-sort__decorator-wrapper={true}>
        <button
          type="button"
          tabindex={gridTabindex}
          class:bx--table-sort={true}
          class:bx--table-sort--active={active}
          class:bx--table-sort--ascending={active &&
            sortDirection === "descending"}
          on:click
        >
          <div class:bx--table-header-label={true}><slot /></div>
          <ArrowUp
            size={20}
            aria-label={ariaLabel}
            class="bx--table-sort__icon"
          />
          <ArrowsVertical
            size={20}
            aria-label={ariaLabel}
            class="bx--table-sort__icon-unsorted"
          />
        </button>
        <Decorator
          class="bx--table-sort__decorator"
          state={aiLabelState}
          labelAlign="start"
        >
          <slot name="decorator" />
        </Decorator>
      </div>
    {:else}
      <button
        type="button"
        tabindex={gridTabindex}
        class:bx--table-sort={true}
        class:bx--table-sort--active={active}
        class:bx--table-sort--ascending={active &&
          sortDirection === "descending"}
        on:click
      >
        <div class:bx--table-header-label={true}><slot /></div>
        <ArrowUp
          size={20}
          aria-label={ariaLabel}
          class="bx--table-sort__icon"
        />
        <ArrowsVertical
          size={20}
          aria-label={ariaLabel}
          class="bx--table-sort__icon-unsorted"
        />
      </button>
    {/if}
  </th>
{:else}
  <th
    {id}
    {scope}
    data-header={id}
    tabindex={gridTabindex}
    class:bx--table-header--ai-label={$aiLabelState === "active"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div
      class:bx--table-header-label={true}
      class:bx--table-header-label--decorator={$$slots.decorator}
    >
      <slot />
      {#if $$slots.decorator}
        <Decorator
          class="bx--table-header-label--decorator-inner"
          state={aiLabelState}
          labelAlign="start"
        >
          <slot name="decorator" />
        </Decorator>
      {/if}
    </div>
  </th>
{/if}
