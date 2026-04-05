<script lang="ts">
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ] as const;

  const rows = [
    { id: "a", name: "Zebra", port: 1 },
    { id: "b", name: "Alpha", port: 2 },
  ] as const;

  /** When true, `on:sort` calls preventDefault() so the table does not apply client-side sort. */
  export let preventSortDefault = false;

  export let onsort:
    | ((
        e: CustomEvent<{
          key: string | null;
          direction: "none" | "ascending" | "descending";
        }>,
      ) => void)
    | undefined = undefined;
</script>

<DataTable
  sortable
  {headers}
  {rows}
  on:sort={(e) => {
    onsort?.(e);
    if (preventSortDefault) e.preventDefault();
  }}
/>
