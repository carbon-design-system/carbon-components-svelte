<script>
  /**
   * Dispatched when the user changes the page or page size through any interaction.
   * @event change
   * @type {object}
   * @property {number} [page]
   * @property {number} [pageSize]
   * @event click:button--previous
   * Dispatched when the user clicks the previous page button.
   * @type {object}
   * @property {number} page
   * @event click:button--next
   * Dispatched when the user clicks the next page button.
   * @type {object}
   * @property {number} page
   * @event update
   * Dispatched reactively whenever the page or page size changes.
   * @type {object}
   * @property {number} pageSize
   * @property {number} page
   */

  /** Specify the current page index */
  export let page = 1;

  /** Specify the total number of items */
  export let totalItems = 0;

  /**
   * If `totalItems` is a large number, it can affect the
   * rendering performance of this component since its value
   * is used to calculate the number of pages in the native
   * select dropdown. This value creates a small window of
   * pages rendered around the current page. By default,
   * a maximum of 1000 select items are rendered.
   */
  export let pageWindow = 1000;

  /** Set to `true` to disable the pagination */
  export let disabled = false;

  /** Specify the forward button text */
  export let forwardText = "Next page";

  /** Specify the backward button text */
  export let backwardText = "Previous page";

  /** Specify the items per page text */
  export let itemsPerPageText = "Items per page:";

  /**
   * Override the item text.
   * @type {(min: number, max: number) => string}
   */
  export let itemText = (min, max) =>
    `${min.toLocaleString()}–${max.toLocaleString()} item${max === 1 ? "" : "s"}`;

  /**
   * Override the item range text.
   * @type {(min: number, max: number, total: number) => string}
   */
  export let itemRangeText = (min, max, total) =>
    `${min.toLocaleString()}–${max.toLocaleString()} of ${total.toLocaleString()} item${max === 1 ? "" : "s"}`;

  /** Set to `true` to disable the page input */
  export let pageInputDisabled = false;

  /** Set to `true` to disable the page size input */
  export let pageSizeInputDisabled = false;

  /** Specify the number of items to display in a page */
  export let pageSize = 10;

  /**
   * Specify the available page sizes.
   * @type {ReadonlyArray<number>}
   */
  export let pageSizes = [10];

  /**
   * Set to `true` to dynamically filter page sizes based on total items.
   * Page sizes larger than needed to display all items on a single page are hidden.
   * @example
   * <Pagination totalItems={9} pageSizes={[5, 10, 15]} dynamicPageSizes />
   * <!-- renders [5, 10] -->
   */
  export let dynamicPageSizes = false;

  /** Set to `true` if the number of pages is unknown */
  export let pagesUnknown = false;

  /**
   * Override the page text.
   * @type {(page: number) => string}
   */
  export let pageText = (page) => `page ${page.toLocaleString()}`;

  /**
   * Override the page range text.
   * @type {(current: number, total: number) => string}
   */
  export let pageRangeText = (_current, total) =>
    `of ${total.toLocaleString()} page${total === 1 ? "" : "s"}`;

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import CaretLeft from "../icons/CaretLeft.svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";

  const dispatch = createEventDispatcher();

  let prevPage = page;
  let prevPageSize = pageSize;

  /**
   * Returns a subset of page numbers centered around the current page to prevent
   * performance issues with large datasets. Creates a capped window of pages
   * instead of potentially thousands, improving render speed and memory usage.
   * @param {number} currentPage - The current page number.
   * @param {number} totalPages - Total number of pages.
   * @param {number} window - How many pages to show before/after current page.
   * @returns {number[]} Array of page numbers to display.
   */
  function getWindowedPages(currentPage, totalPages, window) {
    const start = Math.max(1, currentPage - window);
    const end = Math.min(totalPages, currentPage + window);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Filters page sizes to remove redundant options based on total items.
   * Keeps all sizes up to and including the first one >= totalItems.
   * @param {ReadonlyArray<number>} sizes - Available page sizes.
   * @param {number} total - Total number of items.
   * @returns {number[]} Filtered array of page sizes.
   */
  function getFilteredPageSizes(sizes, total) {
    if (total <= 0) return sizes.slice(0, 1);
    const filtered = [];
    for (const size of sizes) {
      filtered.push(size);
      if (size >= total) break;
    }
    return filtered.length ? filtered : sizes.slice(0, 1);
  }

  $: totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  $: if (page > totalPages) page = totalPages;
  $: if (prevPage !== page || prevPageSize !== pageSize) {
    dispatch("update", { pageSize, page });
    prevPage = page;
    prevPageSize = pageSize;
  }
  $: selectItems = getWindowedPages(page, totalPages, pageWindow);
  $: effectivePageSizes = dynamicPageSizes
    ? getFilteredPageSizes(pageSizes, totalItems)
    : pageSizes;
  $: backButtonDisabled = disabled || page === 1;
  $: forwardButtonDisabled = disabled || page === totalPages;
</script>

<div {id} class:bx--pagination={true} {...$$restProps}>
  <div class:bx--pagination__left={true}>
    {#if !pageSizeInputDisabled}
      <label
        id="bx--pagination-select-{id}-count-label"
        for="bx--pagination-select-{id}"
        class:bx--pagination__text={true}
      >
        {itemsPerPageText}
      </label>
      <Select
        id="bx--pagination-select-{id}"
        class="bx--select__item-count"
        hideLabel
        noLabel
        inline
        on:update={(event) => {
          dispatch("change", { pageSize: event.detail });
        }}
        bind:selected={pageSize}
      >
        {#each effectivePageSizes as size, i (size)}
          <SelectItem value={size} text={size.toString()} />
        {/each}
      </Select>
    {/if}
    <span class:bx--pagination__text={!pageSizeInputDisabled}>
      {#if pagesUnknown}
        {itemText(pageSize * (page - 1) + 1, page * pageSize)}
      {:else}
        {itemRangeText(
          Math.min(pageSize * (page - 1) + 1, totalItems),
          Math.min(page * pageSize, totalItems),
          totalItems,
        )}
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
        on:update={(event) => {
          dispatch("change", { page: event.detail });
        }}
        bind:selected={page}
      >
        {#each selectItems as size, i (size)}
          <SelectItem value={size} text={size.toString()} />
        {/each}
      </Select>
      <span class:bx--pagination__text={true}>
        {#if pagesUnknown}
          {pageText(page)}
        {:else}{pageRangeText(page, totalPages)}{/if}
      </span>
    {/if}
    <Button
      kind="ghost"
      tooltipAlignment="center"
      tooltipPosition="top"
      icon={CaretLeft}
      iconDescription={backwardText}
      disabled={backButtonDisabled}
      class="bx--pagination__button bx--pagination__button--backward {backButtonDisabled
        ? 'bx--pagination__button--no-index'
        : ''}"
      on:click={() => {
        page--;
        dispatch("click:button--previous", { page });
        dispatch("change", { page });
      }}
    />
    <Button
      kind="ghost"
      tooltipAlignment="end"
      tooltipPosition="top"
      icon={CaretRight}
      iconDescription={forwardText}
      disabled={forwardButtonDisabled}
      class="bx--pagination__button bx--pagination__button--forward {forwardButtonDisabled
        ? 'bx--pagination__button--no-index'
        : ''}"
      on:click={() => {
        page++;
        dispatch("click:button--next", { page });
        dispatch("change", { page });
      }}
    />
  </div>
</div>
