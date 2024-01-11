<script>
  /**
   * @event {{ page?: number; pageSize?: number }} change - Dispatched after any user interaction
   * @event {{ page: number; }} click:button--previous
   * @event {{ page: number; }} click:button--next
   * @event {{ pageSize: number; page: number; }} update
   */

  /** Specify the current page index */
  export let page = 1;

  /** Specify the total number of items */
  export let totalItems = 0;

  /** Set to `true` to disable the pagination */
  export let disabled = false;

  /** Specify the forward button text */
  export let forwardText = "Next page";

  /** Specify the backward button text */
  export let backwardText = "Previous page";

  /** Specify the items per page text */
  export let itemsPerPageText = "Items per page:";

  /**
   * Override the item text
   * @type {(min: number, max: number) => string}
   */
  export let itemText = (min, max) =>
    `${min}–${max} item${max === 1 ? "" : "s"}`;

  /**
   * Override the item range text
   * @type {(min: number, max: number, total: number) => string}
   */
  export let itemRangeText = (min, max, total) =>
    `${min}–${max} of ${total} item${max === 1 ? "" : "s"}`;

  /** Set to `true` to disable the page input */
  export let pageInputDisabled = false;

  /** Set to `true` to disable the page size input */
  export let pageSizeInputDisabled = false;

  /** Specify the number of items to display in a page */
  export let pageSize = 10;

  /**
   * Specify the available page sizes
   * @type {ReadonlyArray<number>}
   */
  export let pageSizes = [10];

  /** Set to `true` if the number of pages is unknown */
  export let pagesUnknown = false;

  /**
   * Override the page text
   * @type {(page: number) => string}
   */
  export let pageText = (page) => `page ${page}`;

  /**
   * Override the page range text
   * @type {(current: number, total: number) => string}
   */
  export let pageRangeText = (current, total) =>
    `of ${total} page${total === 1 ? "" : "s"}`;

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  import { afterUpdate, createEventDispatcher } from "svelte";
  import CaretLeft from "../icons/CaretLeft.svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Button from "../Button/Button.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";

  const dispatch = createEventDispatcher();

  afterUpdate(() => {
    if (page > totalPages) {
      page = totalPages;
    }
  });

  $: dispatch("update", { pageSize, page });
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
        on:change="{() => {
          dispatch('change', { pageSize });
        }}"
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
        {itemRangeText(
          Math.min(pageSize * (page - 1) + 1, totalItems),
          Math.min(page * pageSize, totalItems),
          totalItems
        )}
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
        on:change="{() => {
          dispatch('change', { page });
        }}"
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
      kind="ghost"
      tooltipAlignment="center"
      tooltipPosition="top"
      icon="{CaretLeft}"
      iconDescription="{backwardText}"
      disabled="{backButtonDisabled}"
      class="bx--pagination__button bx--pagination__button--backward {backButtonDisabled
        ? 'bx--pagination__button--no-index'
        : ''}"
      on:click="{() => {
        page--;
        dispatch('click:button--previous', { page });
        dispatch('change', { page });
      }}"
    />
    <Button
      kind="ghost"
      tooltipAlignment="end"
      tooltipPosition="top"
      icon="{CaretRight}"
      iconDescription="{forwardText}"
      disabled="{forwardButtonDisabled}"
      class="bx--pagination__button bx--pagination__button--forward {forwardButtonDisabled
        ? 'bx--pagination__button--no-index'
        : ''}"
      on:click="{() => {
        page++;
        dispatch('click:button--next', { page });
        dispatch('change', { page });
      }}"
    />
  </div>
</div>
