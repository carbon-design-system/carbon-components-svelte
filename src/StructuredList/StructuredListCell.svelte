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
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  import { createEventDispatcher, getContext } from "svelte";
  import { readable } from "svelte/store";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? readable(false);

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

  /** @param {"none" | "ascending" | "descending"} current */
  function nextSortDirection(current) {
    if (current === "none") return "ascending";
    if (current === "ascending") return "descending";
    return sortAlways ? "ascending" : "none";
  }

  function handleSortClick() {
    const currentDirection = active ? sortDirection : "none";
    dispatch("sort", { direction: nextSortDirection(currentDirection) });
  }
</script>

{#if head && sortable}
  <div
    role={$selection ? undefined : "columnheader"}
    aria-sort={$selection ? undefined : active ? sortDirection : "none"}
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
        width="16"
        height="16"
        aria-hidden={ariaLabel ? undefined : true}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        class="bx--structured-list-sort__icon"
      >
        <path
          d="M16 4L6 14 7.41 15.41 15 7.83 15 28 17 28 17 7.83 24.59 15.41 26 14 16 4z"
        ></path>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
        width="16"
        height="16"
        aria-hidden={ariaLabel ? undefined : true}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        class="bx--structured-list-sort__icon-unsorted"
      >
        <path
          d="M27.6 20.6L24 24.2 24 4 22 4 22 24.2 18.4 20.6 17 22 23 28 29 22zM9 4L3 10 4.4 11.4 8 7.8 8 28 10 28 10 7.8 13.6 11.4 15 10z"
        ></path>
      </svg>
    </button>
  </div>
{:else}
  <div
    role={$selection ? undefined : head ? "columnheader" : "cell"}
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
