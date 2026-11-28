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
   * Specify the page text, which names a page button.
   * @type {(page: number) => string}
   */
  export let pageText;

  /**
   * Specify the accessible label for the page select.
   * @type {(total: number) => string}
   */
  export let pageSelectLabelText;

  import { createEventDispatcher } from "svelte";
  import BuiltinOverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import { getIconContext } from "../utils/icon-context.js";
  import PaginationItem from "./PaginationItem.svelte";

  const { OverflowMenuHorizontal = BuiltinOverflowMenuHorizontal } =
    getIconContext();

  const dispatch = createEventDispatcher();

  // A native select can't open until it has focus or a pointer press, so an
  // overflow of more than 1000 pages lists them on the first of those.
  // Shorter overflows render up front.
  const EAGER_OPTIONS = 1000;

  let value = "";
  let interacted = false;

  $: populated = interacted || count <= EAGER_OPTIONS;
</script>

{#if count > 1}
  <li class:bx--pagination-nav__list-item={true}>
    <div class:bx--pagination-nav__select={true}>
      <select
        aria-label={pageSelectLabelText(total)}
        {value}
        class:bx--pagination-nav__page={true}
        class:bx--pagination-nav__page--select={true}
        on:focus={() => {
          interacted = true;
        }}
        on:pointerdown={() => {
          interacted = true;
        }}
        on:change={(event) => {
          value = "";
          dispatch("select", {
            index: Number(
              /** @type {HTMLSelectElement} */ (event.target).value,
            ),
          });
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
    label={pageText(fromIndex + 1)}
    on:click={() => {
      dispatch("select", { index: fromIndex + 1 });
    }}
  />
{/if}
