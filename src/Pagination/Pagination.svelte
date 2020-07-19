<script>
  export let totalItems = 0;
  export let disabled = false;
  export let forwardText = "Next page";
  export let backwardText = "Previous page";
  export let itemRangeText = (min, max, total) =>
    `${min}–${max} of ${total} items`;
  export let itemsPerPageText = "Items per page:";
  export let itemText = (min, max) => `${min}–${max} items`;
  export let page = 1;
  export let pageInputDisabled = false;
  export let pageRangeText = (current, total) => `of ${total} pages`;
  export let pageSize = 10;
  export let pageSizes = [10];
  export let pagesUnknown = false;
  export let pageText = page => `page ${page}`;
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

<div class:bx--pagination={true} {...$$restProps}>
  <div class:bx--pagination__left={true}>
    <label
      id="bx--pagination-select-{id}-count-label"
      class:bx--pagination__text={true}
      for="bx--pagination-select-{id}">
      {itemsPerPageText}
    </label>
    <Select
      id="bx--pagination-select-{id}"
      class="bx--select__item-count"
      labelText=""
      hideLabel
      noLabel
      inline
      on:change={() => {
        page = 1;
      }}
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
