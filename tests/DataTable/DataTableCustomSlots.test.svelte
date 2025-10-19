<script lang="ts">
  import { DataTable } from "carbon-components-svelte";

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
  <h2 slot="title" let:props {...props}>Custom Title</h2>
</DataTable>
