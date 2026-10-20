<script>
  /**
   * @event {{ index: number; }} select
   */

  /** Specify the pivot start index */
  export let fromIndex = 0;

  /** Specify the pivot end index */
  export let count = 0;

  /** Specify the total number of pages */
  export let total = 0;

  /**
   * Specify the PaginationNav translator.
   * @type {(id: "page" | "selectPage", data: { page: number; total: number }) => string}
   */
  export let translateWithId;

  import { createEventDispatcher } from "svelte";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import PaginationItem from "./PaginationItem.svelte";

  const dispatch = createEventDispatcher();

  let value = "";
</script>

{#if count > 1}
  <li class:bx--pagination-nav__list-item={true}>
    <div class:bx--pagination-nav__select={true}>
      <select
        aria-label={translateWithId("selectPage", {
          page: fromIndex + 1,
          total,
        })}
        {value}
        class:bx--pagination-nav__page={true}
        class:bx--pagination-nav__page--select={true}
        on:change={(event) => {
          value = "";
          dispatch("select", { index: Number(event.target.value) });
        }}
      >
        <option value="" hidden></option>
        {#each Array.from(
          { length: count },
          (_, index) => index,
        ) as pageOffset (pageOffset)}
          <option
            value={fromIndex + pageOffset + 1}
            data-page={fromIndex + pageOffset + 1}
          >
            {fromIndex + pageOffset + 1}
          </option>
        {/each}
      </select>
      <div class:bx--pagination-nav__select-icon-wrapper={true}>
        <OverflowMenuHorizontal class="bx--pagination-nav__select-icon" />
      </div>
    </div>
  </li>
{:else if count === 1}
  <PaginationItem
    page={fromIndex + 1}
    label={translateWithId("page", { page: fromIndex + 1, total })}
    on:click={() => {
      dispatch("select", { index: fromIndex + 1 });
    }}
  />
{/if}
