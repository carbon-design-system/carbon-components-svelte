<script>
  /**
   * @event {{ index: number; }} select
   */

  /** Specify the pivot start index */
  export let fromIndex = 0;

  /** Specify the pivot end index */
  export let count = 0;

  import { createEventDispatcher } from "svelte";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import PaginationItem from "./PaginationItem.svelte";

  const dispatch = createEventDispatcher();

  let value = "";
</script>

{#if count > 1}
  <li class:bx--pagination-nav__list-item="{true}">
    <div class:bx--pagination-nav__select="{true}">
      <!-- svelte-ignore a11y-no-onchange -->
      <select
        aria-label="Select Page number"
        value="{value}"
        class:bx--pagination-nav__page="{true}"
        class:bx--pagination-nav__page--select="{true}"
        on:change="{({ target }) => {
          value = '';
          dispatch('select', { index: Number(target.value) });
        }}"
      >
        <option value="" hidden></option>
        {#each Array.from({ length: count }, (_, i) => i) as i}
          <option value="{fromIndex + i + 1}" data-page="{fromIndex + i + 1}">
            {fromIndex + i + 1}
          </option>
        {/each}
      </select>
      <div class:bx--pagination-nav__select-icon-wrapper="{true}">
        <OverflowMenuHorizontal class="bx--pagination-nav__select-icon" />
      </div>
    </div>
  </li>
{:else if count === 1}
  <PaginationItem
    page="{fromIndex + 1}"
    on:click="{() => {
      dispatch('select', { index: fromIndex });
    }}"
  >
    Page
  </PaginationItem>
{/if}
