<script lang="ts">
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import type { ComponentProps } from "svelte";

  export let page: ComponentProps<Pagination>["page"] = 1;
  export let totalItems: ComponentProps<Pagination>["totalItems"] = 0;
  export let pageSizes: ComponentProps<Pagination>["pageSizes"] = [10];
  export let disabled: ComponentProps<Pagination>["disabled"] = false;
  export let pageInputDisabled: ComponentProps<Pagination>["pageInputDisabled"] = false;
</script>

<Pagination
  bind:page
  {totalItems}
  {pageSizes}
  {disabled}
  {pageInputDisabled}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <svelte:fragment
    slot="pageSelect"
    let:currentPage
    let:totalPages
    let:currentPageSize
    let:selectLabelText
    let:onSetPage
  >
    <span data-testid="page-select-label">{selectLabelText}</span>
    <span data-testid="current-page">{currentPage}</span>
    <span data-testid="total-pages">{totalPages}</span>
    <span data-testid="current-page-size">{currentPageSize}</span>
    <button type="button" on:click={() => onSetPage(3)}>Go to 3</button>
    <button type="button" on:click={() => onSetPage("not-a-number")}>
      Go to invalid
    </button>
  </svelte:fragment>
</Pagination>
