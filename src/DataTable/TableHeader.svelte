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

  /** Specify the `scope` attribute */
  export let scope = "col";

  /** Default translation ids */
  export const translationIds = {
    columnSortAscending: "columnSortAscending",
    columnSortDescending: "columnSortDescending",
  };

  /**
   * Override the default translation ids.
   * @type {(id: TableHeaderTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /** Set an id for the top-level element */
  export let id = uniqueId();

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
</script>

{#if sortable}
  <th
    {id}
    aria-sort={active ? sortDirection : "none"}
    {scope}
    data-header={id}
    {...$$restProps}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <button
      type="button"
      class:bx--table-sort={true}
      class:bx--table-sort--active={active}
      class:bx--table-sort--ascending={active && sortDirection === "descending"}
      on:click
    >
      <div class:bx--table-header-label={true}><slot /></div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
        width="20"
        height="20"
        aria-hidden={ariaLabel ? undefined : true}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        class="bx--table-sort__icon"
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
        width="20"
        height="20"
        aria-hidden={ariaLabel ? undefined : true}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        class="bx--table-sort__icon-unsorted"
      >
        <path
          d="M27.6 20.6L24 24.2 24 4 22 4 22 24.2 18.4 20.6 17 22 23 28 29 22zM9 4L3 10 4.4 11.4 8 7.8 8 28 10 28 10 7.8 13.6 11.4 15 10z"
        ></path>
      </svg>
    </button>
  </th>
{:else}
  <th
    {id}
    {scope}
    data-header={id}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <div class:bx--table-header-label={true}><slot /></div>
  </th>
{/if}
