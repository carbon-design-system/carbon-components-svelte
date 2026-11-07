<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let selectedRowIds: string[] = [];
  export let sortKey: string | null = null;
  export let sortDirection: "none" | "ascending" | "descending" = "none";
  /** Receives every `sort` event; `preventDefault()` is called when asked. */
  export let onsort: ((detail: unknown) => void) | undefined = undefined;
  export let preventSortDefault = false;
</script>

<DataTable
  {...$$restProps}
  bind:selectedRowIds
  bind:sortKey
  bind:sortDirection
  on:sort={(e) => {
    onsort?.(e.detail);
    if (preventSortDefault) e.preventDefault();
  }}
/>
<output data-testid="state"
  >{selectedRowIds.join(",")}|{sortKey ?? ""}|{sortDirection}</output
>
