<script>
  /**
   * Specify the current page index
   * @type {number} [page=1]
   */
  export let page = 1;

  /**
   * Specify the total number of items
   * @type {number} [total=0]
   */
  export let totalItems = 0;

  /**
   * Set to `true` to disable the pagination
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the forward button text
   * @type {string} [forwardText="Next page"]
   */
  export let forwardText = "Next page";

  /**
   * Specify the backward button text
   * @type {string} [backwardText="Previous page"]
   */
  export let backwardText = "Previous page";

  /**
   * Specify the items per page text
   * @type {string} [itemsPerPageText="Items per page:"]
   */
  export let itemsPerPageText = "Items per page:";

  /**
   * Override the item text
   * @type {(min: number, max: number) => string;} [itemText = (min: number, max: number) => string;]
   */
  export let itemText = (min, max) => `${min}–${max} items`;

  /**
   * Override the item range text
   * @type {(min: number, max: number, total: number) => string;} [itemRangeText = (min: number, max: number, total: number) => string;]
   */
  export let itemRangeText = (min, max, total) =>
    `${min}–${max} of ${total} items`;

  /**
   * Set to `true` to disable the page input
   * @type {boolean} [pageInputDisabled=false]
   */
  export let pageInputDisabled = false;

  /**
   * Specify the number of items to display in a page
   * @type {number} [pageSize=10]
   */
  export let pageSize = 10;

  /**
   * Specify the available page sizes
   * @type {number[]} [pageSizes=[10]]
   */
  export let pageSizes = [10];

  /**
   * Set to `true` if the number of pages is unknown
   * @type {boolean} [pagesUnknown=false]
   */
  export let pagesUnknown = false;

  /**
   * Override the page text
   * @type {(page: number) => string;} [pageText = (current: number) => string;]
   */
  export let pageText = (page) => `page ${page}`;

  /**
   * Override the page range text
   * @type {(current: number, total: number) => string;} [pageRangeText = (current: number, total: number) => string;]
   */
  export let pageRangeText = (current, total) => `of ${total} pages`;

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  import CaretLeft24 from "carbon-icons-svelte/lib/CaretLeft24";
  import CaretRight24 from "carbon-icons-svelte/lib/CaretRight24";
  import { Select, SelectItem } from "../Select";
  import { afterUpdate, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  afterUpdate(() => {
    dispatch("update", { pageSize: parseInt(pageSize), page: parseInt(page) });
  });

  $: totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  $: selectItems = Array.from({ length: totalPages }, (_, i) => i);
  $: backButtonDisabled = disabled || page === 1;
  $: forwardButtonDisabled = disabled || page === totalPages;
</script>

<div {id} class:bx--pagination={true} {...$$restProps}>
  <div class:bx--pagination__left={true}>
    <label
      id="bx--pagination-select-{id}-count-label"
      for="bx--pagination-select-{id}"
      class:bx--pagination__text={true}>
      {itemsPerPageText}
    </label>
    <Select
      id="bx--pagination-select-{id}"
      class="bx--select__item-count"
      hideLabel
      noLabel
      inline
      bind:selected={pageSize}>
      {#each pageSizes as size, i (size)}
        <SelectItem value={size} text={size.toString()} />
      {/each}
    </Select>
    <span class:bx--pagination__text={true}>
      {#if pagesUnknown}
        {itemText(pageSize * (page - 1) + 1, page * pageSize)}
      {:else}
        {itemRangeText(Math.min(pageSize * (page - 1) + 1, totalItems), Math.min(page * pageSize, totalItems), totalItems)}
      {/if}
    </span>
  </div>
  <div class:bx--pagination__right={true}>
    {#if !pageInputDisabled}
      <Select
        id="bx--pagination-select-{id + 2}"
        class="bx--select__page-number"
        labelText="Page number, of {totalPages} pages"
        inline
        hideLabel
        bind:selected={page}>
        {#each selectItems as size, i (size)}
          <SelectItem value={size + 1} text={(size + 1).toString()} />
        {/each}
      </Select>
      <span class:bx--pagination__text={true}>
        {#if pagesUnknown}
          {pageText(page)}
        {:else}{pageRangeText(page, totalPages)}{/if}
      </span>
    {/if}
    <button
      type="button"
      aria-label={backwardText}
      disabled={backButtonDisabled}
      class:bx--pagination__button={true}
      class:bx--pagination__button--backward={true}
      class:bx--pagination__button--no-index={backButtonDisabled}
      on:click={() => {
        page--;
      }}>
      <CaretLeft24 />
    </button>
    <button
      type="button"
      aria-label={forwardText}
      disabled={forwardButtonDisabled}
      class:bx--pagination__button={true}
      class:bx--pagination__button--forward={true}
      class:bx--pagination__button--no-index={forwardButtonDisabled}
      on:click={() => {
        page++;
      }}>
      <CaretRight24 />
    </button>
  </div>
</div>
