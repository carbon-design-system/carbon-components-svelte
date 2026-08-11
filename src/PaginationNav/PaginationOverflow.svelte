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

  // Below this count, the option list is cheap enough to render up front;
  // deferring it would only add interaction overhead for no real DOM savings.
  // Matches the 1000-item default tolerance in Pagination's `pageWindow`.
  const EAGER_RENDER_THRESHOLD = 1000;

  let value = "";
  let interacted = false;

  // Defer rendering large sets of hidden page options until the user
  // actually interacts with the select, since it may never be opened.
  $: populated = interacted || count <= EAGER_RENDER_THRESHOLD;
</script>

{#if count > 1}
  <li class:bx--pagination-nav__list-item={true}>
    <div class:bx--pagination-nav__select={true}>
      <!-- svelte-ignore a11y-no-onchange -->
      <select
        aria-label="Select Page number"
        {value}
        class:bx--pagination-nav__page={true}
        class:bx--pagination-nav__page--select={true}
        on:focus={() => {
          interacted = true;
        }}
        on:mousedown={() => {
          interacted = true;
        }}
        on:change={(event) => {
          value = "";
          dispatch("select", { index: Number(event.target.value) });
        }}
      >
        <option value="" hidden></option>
        {#if populated}
          {#each Array.from({ length: count }, (_, index) => index) as pageOffset (pageOffset)}
            <option
              value={fromIndex + pageOffset + 1}
              data-page={fromIndex + pageOffset + 1}
            >
              {fromIndex + pageOffset + 1}
            </option>
          {/each}
        {/if}
      </select>
      <div class:bx--pagination-nav__select-icon-wrapper={true}>
        <OverflowMenuHorizontal class="bx--pagination-nav__select-icon" />
      </div>
    </div>
  </li>
{:else if count === 1}
  <PaginationItem
    page={fromIndex + 1}
    on:click={() => {
      dispatch("select", { index: fromIndex + 1 });
    }}
  >
    Page
  </PaginationItem>
{/if}
