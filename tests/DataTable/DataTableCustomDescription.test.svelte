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
  <div slot="descriptionChildren" let:props {...props}>Custom Description</div>
</DataTable>
