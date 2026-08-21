<script lang="ts">
  import TableSkeleton from "carbon-components-svelte/Table/TableSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let columns: ComponentProps<TableSkeleton>["columns"] = undefined;
  export let rows: ComponentProps<TableSkeleton>["rows"] = undefined;
  export let size: ComponentProps<TableSkeleton>["size"] = undefined;
  export let headers: ComponentProps<TableSkeleton>["headers"] = undefined;
</script>

<TableSkeleton {columns} {rows} {size} {headers} />
