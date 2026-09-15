<script>
  import {
    DataTable,
    Toolbar,
    ToolbarColumnVisibility,
    ToolbarContent,
  } from "carbon-components-svelte";

  let headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 1", protocol: "HTTP", port: 443 },
  ];
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarColumnVisibility bind:headers />
    </ToolbarContent>
  </Toolbar>
</DataTable>
