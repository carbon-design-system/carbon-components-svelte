<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 1", protocol: "HTTP" },
    { id: "b", name: "Load Balancer 2", protocol: "HTTPS" },
  ];
</script>

<DataTable expandable {headers} {rows}>
  <svelte:fragment slot="expandIcon" let:expanded let:props>
    <ChevronRight
      {...props}
      data-testid="custom-expand-icon"
      data-expanded={expanded}
    />
  </svelte:fragment>
  <svelte:fragment slot="expandedRow" let:row>
    <pre>{JSON.stringify(row, null, 2)}</pre>
  </svelte:fragment>
</DataTable>
