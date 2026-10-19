<script lang="ts">
  import PaginationNav from "carbon-components-svelte/PaginationNav/PaginationNav.svelte";
  import type { ComponentProps } from "svelte";

  export let page = 1;
  export let total = 10;
  export let shown = 10;
  export let loop = false;
  export let forwardText = "Next page";
  export let backwardText = "Previous page";
  export let tooltipPosition: ComponentProps<PaginationNav>["tooltipPosition"] =
    "bottom";
  export let onChange: (detail: { page: number }) => void = () => {};
  export let onPrevious: (detail: { page: number }) => void = () => {};
  export let onNext: (detail: { page: number }) => void = () => {};
</script>

<PaginationNav
  bind:page
  {total}
  {shown}
  {loop}
  {forwardText}
  {backwardText}
  {tooltipPosition}
  on:change={(e) => onChange(e.detail)}
  on:click:button--previous={(e) => onPrevious(e.detail)}
  on:click:button--next={(e) => onNext(e.detail)}
/>
