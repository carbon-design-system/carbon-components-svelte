<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ] as const;

  const rows = [
    { id: "a", name: "Zebra", protocol: "HTTP" },
    { id: "b", name: "Alpha", protocol: "FTP" },
  ] as const;

  export let filters: Record<string, unknown> = {};

  /** When true, `on:filter` calls preventDefault() so the table does not filter client-side. */
  export let preventFilterDefault = false;

  export let onfilter:
    | ((
        e: CustomEvent<{
          key: string | null;
          value: unknown;
          filters: Record<string, unknown>;
        }>,
      ) => void)
    | undefined = undefined;
</script>

<DataTable
  {headers}
  {rows}
  {filters}
  on:filter={(e) => {
    onfilter?.(e);
    if (preventFilterDefault) e.preventDefault();
  }}
/>
