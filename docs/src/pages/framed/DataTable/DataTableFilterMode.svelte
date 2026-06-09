<script>
  import {
    DataTable,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
    note: "",
  }));
</script>

<DataTable
  filterMode="hide"
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "note", value: "Note" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
  <svelte:fragment slot="cell" let:cell let:row>
    {#if cell.key === "note"}
      <TextInput
        size="sm"
        labelText="Note for {row.name}"
        hideLabel
        placeholder="Type a note, then filter"
      />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
