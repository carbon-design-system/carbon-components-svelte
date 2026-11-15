<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ] as const;

  const rows = [
    {
      id: "a",
      name: "Load Balancer 1",
      protocol: "HTTP",
    },
  ];
</script>

<DataTable {headers} {rows}>
  {#snippet titleChildren({ props })}
    <h2 {...props}>Custom Title</h2>
  {/snippet}
</DataTable>
