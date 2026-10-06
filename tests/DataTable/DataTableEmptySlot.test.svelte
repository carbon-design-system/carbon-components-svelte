<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let filterMode: "remove" | "hide" = "remove";
  export let empty = false;

  const rows = empty
    ? []
    : Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        name: `Load Balancer ${i + 1}`,
        rule: "Round robin",
      }));
</script>

<DataTable
  {filterMode}
  headers={[
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
  <svelte:fragment slot="empty">
    <strong>No load balancers</strong>
    <span>Create one to route traffic.</span>
  </svelte:fragment>
  <div slot="noResults">No matching load balancers</div>
</DataTable>
