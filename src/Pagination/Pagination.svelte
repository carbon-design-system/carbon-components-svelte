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
   * @type {(min: number, max: number) => string} [itemText = (min: number, max: number) => string]
   */
  export let itemText = (min, max) => `${min}–${max} items`;

  /**
   * Override the item range text
   * @type {(min: number, max: number, total: number) => string} [itemRangeText = (min: number, max: number, total: number) => string]
   */
  export let itemRangeText = (min, max, total) =>
    `${min}–${max} of ${total} items`;

  /**
   * Set to `true` to disable the page input
   * @type {boolean} [pageInputDisabled=false]
   */
  export let pageInputDisabled = false;

  /**
   * Set to `true` to disable the page size input
   * @type {boolean} [pageSizeInputDisabled=false]
   */
  export let pageSizeInputDisabled = false;

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
   * @type {(page: number) => string} [pageText = (current: number) => string]
   */
  export let pageText = (page) => `page ${page}`;

  /**
   * Override the page range text
   * @type {(current: number, total: number) => string} [pageRangeText = (current: number, total: number) => string]
   */
  export let pageRangeText = (current, total) =>
    `of ${total} page${total === 1 ? "" : "s"}`;

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  import { createEventDispatcher } from "svelte";
  import CaretLeft16 from "carbon-icons-svelte/lib/CaretLeft16";
  import CaretRight16 from "carbon-icons-svelte/lib/CaretRight16";
  import { Button } from "../Button";
  import { Select, SelectItem } from "../Select";

  const dispatch = createEventDispatcher();

  $: {
    if (typeof page !== "number") {
      page = Number(page);
    }

    if (typeof pageSize !== "number") {
      pageSize = Number(pageSize);
    }

    dispatch("update", { pageSize, page });
  }
  $: totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  $: selectItems = Array.from({ length: totalPages }, (_, i) => i);
  $: backButtonDisabled = disabled || page === 1;
  $: forwardButtonDisabled = disabled || page === totalPages;
</script>

<div id="{id}" class:bx--pagination="{true}" {...$$restProps}>
  <div class:bx--pagination__left="{true}">
    {#if !pageSizeInputDisabled}
      <label
        id="bx--pagination-select-{id}-count-label"
        for="bx--pagination-select-{id}"
        class:bx--pagination__text="{true}"
      >
        {itemsPerPageText}
      </label>
      <Select
        id="bx--pagination-select-{id}"
        class="bx--select__item-count"
        hideLabel
        noLabel
        inline
        bind:selected="{pageSize}"
      >
        {#each pageSizes as size, i (size)}
          <SelectItem value="{size}" text="{size.toString()}" />
        {/each}
      </Select>
    {/if}
    <span class:bx--pagination__text="{!pageSizeInputDisabled}">
      {#if pagesUnknown}
        {itemText(pageSize * (page - 1) + 1, page * pageSize)}
      {:else}
        {itemRangeText(Math.min(pageSize * (page - 1) + 1, totalItems), Math.min(page * pageSize, totalItems), totalItems)}
      {/if}
    </span>
  </div>
  <div class:bx--pagination__right="{true}">
    {#if !pageInputDisabled}
      <Select
        id="bx--pagination-select-{id + 2}"
        class="bx--select__page-number"
        labelText="Page number, of {totalPages} pages"
        inline
        hideLabel
        bind:selected="{page}"
      >
        {#each selectItems as size, i (size)}
          <SelectItem value="{size + 1}" text="{(size + 1).toString()}" />
        {/each}
      </Select>
      <span class:bx--pagination__text="{true}">
        {#if pagesUnknown}
          {pageText(page)}
        {:else}{pageRangeText(page, totalPages)}{/if}
      </span>
    {/if}
    <Button
      hasIconOnly
      kind="ghost"
      tooltipAlignment="center"
      tooltipPosition="top"
      icon="{CaretLeft16}"
      iconDescription="{backwardText}"
      disabled="{backButtonDisabled}"
      class="bx--pagination__button bx--pagination__button--backward {backButtonDisabled ? 'bx--pagination__button--no-index' : ''}"
      on:click="{() => {
        page--;
      }}"
    />
    <Button
      hasIconOnly
      kind="ghost"
      tooltipAlignment="end"
      tooltipPosition="top"
      icon="{CaretRight16}"
      iconDescription="{forwardText}"
      disabled="{forwardButtonDisabled}"
      class="bx--pagination__button bx--pagination__button--forward {forwardButtonDisabled ? 'bx--pagination__button--no-index' : ''}"
      on:click="{() => {
        page++;
      }}"
    />
  </div>
</div>
