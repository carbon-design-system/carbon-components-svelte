<script>
  /**
   * @typedef {"columnSortAscending" | "columnSortDescending"} StructuredListCellTranslationId
   */

  /**
   * @event {{ direction: "none" | "ascending" | "descending" }} sort - Dispatched when the sortable header button is clicked, with the next direction in the sort cycle.
   */

  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to prevent wrapping */
  export let noWrap = false;

  /**
   * Set to `true` to render the header cell as a sortable column button.
   * Only applies when `head` is `true`.
   */
  export let sortable = false;

  /**
   * Specify the sort direction.
   * Only used when `sortable` is `true`.
   * @type {"none" | "ascending" | "descending"}
   */
  export let sortDirection = "none";

  /** Set to `true` when this column is the active sort key */
  export let active = false;

  /**
   * Set to `true` to only toggle between "ascending" and "descending"
   * sort directions, skipping "none", when computing the `sort` event.
   * Only used when `sortable` is `true`.
   */
  export let sortAlways = false;

  /** Default translation ids */
  export const translationIds = {
    columnSortAscending: "columnSortAscending",
    columnSortDescending: "columnSortDescending",
  };

  /**
   * Override the default translation ids.
   * Only used when `sortable` is `true`.
   * @type {(id: StructuredListCellTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  import { createEventDispatcher, getContext } from "svelte";
  import ArrowsVertical from "../icons/ArrowsVertical.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? false;

  const dispatch = createEventDispatcher();

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

  function handleSortClick() {
    const currentDirection = active ? sortDirection : "none";
    const nextDirection =
      currentDirection === "none"
        ? "ascending"
        : currentDirection === "ascending"
          ? "descending"
          : sortAlways
            ? "ascending"
            : "none";
    dispatch("sort", { direction: nextDirection });
  }
</script>

{#if head && sortable}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div
    role={selection ? undefined : "columnheader"}
    aria-sort={active ? sortDirection : "none"}
    class:bx--structured-list-th={true}
    class:bx--structured-list-th--sortable={true}
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <button
      type="button"
      class:bx--structured-list-sort={true}
      class:bx--structured-list-sort--active={active}
      class:bx--structured-list-sort--ascending={active &&
        sortDirection === "descending"}
      on:click
      on:click={handleSortClick}
    >
      <slot />
      <ArrowUp
        size={16}
        aria-label={ariaLabel}
        class="bx--structured-list-sort__icon"
      />
      <ArrowsVertical
        size={16}
        aria-label={ariaLabel}
        class="bx--structured-list-sort__icon-unsorted"
      />
    </button>
  </div>
{:else}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div
    role={selection ? undefined : head ? "columnheader" : "cell"}
    class:bx--structured-list-th={head}
    class:bx--structured-list-td={!head}
    class:bx--structured-list-content--nowrap={noWrap}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </div>
{/if}
