<script lang="ts">
  import { PaginationNav } from "carbon-components-svelte";

  export let page = 1;
  export let total = 10;
  export let shown = 10;
  export let loop = false;
  export let forwardText = "Next page";
  export let backwardText = "Previous page";
  export let tooltipPosition:
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "outside"
    | "inside" = "bottom";
</script>

<PaginationNav
  bind:page
  {total}
  {shown}
  {loop}
  {forwardText}
  {backwardText}
  {tooltipPosition}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:click:button--previous={(e) => {
    console.log("previous", e.detail);
  }}
  on:click:button--next={(e) => {
    console.log("next", e.detail);
  }}
/>
