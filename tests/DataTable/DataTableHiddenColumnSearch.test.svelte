<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "rule", value: "Rule", columnHidden: true },
  ]}
  rows={[
    { id: "a", name: "Load Balancer 3", protocol: "HTTP", rule: "Round robin" },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      rule: "DNS delegation",
    },
  ]}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
</DataTable>
