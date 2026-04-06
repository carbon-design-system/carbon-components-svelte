<script lang="ts">
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 3", port: 3000, rule: "Round robin" },
    { id: "b", name: "Load Balancer 1", port: 443, rule: "Round robin" },
    { id: "c", name: "Load Balancer 2", port: 80, rule: "DNS delegation" },
  ];

  export let selectedRowIds: ComponentProps<DataTable>["selectedRowIds"] = [];
</script>

<DataTable selectable {headers} {rows} bind:selectedRowIds>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent />
      <Button>Action</Button>
    </ToolbarContent>
  </Toolbar>
</DataTable>
