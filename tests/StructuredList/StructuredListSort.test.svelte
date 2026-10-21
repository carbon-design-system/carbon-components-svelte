<script lang="ts">
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";

  export let active = false;
  export let sortDirection: "none" | "ascending" | "descending" = "none";
  export let sortAlways = false;
  export let onSort: (detail: { direction: string }) => void = () => {};
</script>

<StructuredListCell
  head
  sortable
  {active}
  {sortDirection}
  {sortAlways}
  on:sort={(e) => onSort(e.detail)}
  >Column</StructuredListCell
>
