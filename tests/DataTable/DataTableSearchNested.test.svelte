<script lang="ts">
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  export let value = "";

  const rows = [
    { id: "1", contact: { company: "Super Wheels" } },
    { id: "2", contact: { company: "Mini Wheels" } },
    { id: "3", contact: { company: "Mega Corp" } },
  ];

  let filteredRowIds: string[] = [];
</script>

<DataTable
  headers={[
    { key: "id", value: "ID" },
    { key: "contact.company", value: "Company name" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent {value} shouldFilterRows bind:filteredRowIds />
    </ToolbarContent>
  </Toolbar>
</DataTable>
