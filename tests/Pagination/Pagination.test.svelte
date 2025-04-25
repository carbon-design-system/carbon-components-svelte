<script lang="ts">
  import { Pagination } from "carbon-components-svelte";

  export let page = 1;
  export let totalItems = 0;
  export let disabled = false;
  export let forwardText = "Next page";
  export let backwardText = "Previous page";
  export let itemsPerPageText = "Items per page:";
  export let pageInputDisabled = false;
  export let pageSizeInputDisabled = false;
  export let pageSize = 10;
  export let pageSizes: ReadonlyArray<number> = [10];
  export let pageWindow: undefined | number = undefined;
  export let pagesUnknown = false;
</script>

<Pagination
  bind:page
  {totalItems}
  {disabled}
  {forwardText}
  {backwardText}
  {itemsPerPageText}
  {pageInputDisabled}
  {pageSizeInputDisabled}
  {pageWindow}
  bind:pageSize
  {pageSizes}
  {pagesUnknown}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:click:button--previous={(e) => {
    console.log("previous", e.detail);
  }}
  on:click:button--next={(e) => {
    console.log("next", e.detail);
  }}
  on:update={(e) => {
    console.log("update", e.detail);
  }}
/>
