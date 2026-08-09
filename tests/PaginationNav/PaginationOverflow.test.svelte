<script lang="ts">
  import PaginationOverflow from "carbon-components-svelte/PaginationNav/PaginationOverflow.svelte";
  import type { ComponentProps } from "svelte";

  export let fromIndex: ComponentProps<PaginationOverflow>["fromIndex"] = 0;
  export let count: ComponentProps<PaginationOverflow>["count"] = 0;
  export let onSelect: (e: CustomEvent<{ index: number }>) => void = () => {};
</script>

<ul>
  <PaginationOverflow {fromIndex} {count} on:select={onSelect} />
</ul>
