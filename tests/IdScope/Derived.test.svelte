<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import { createIdScope } from "carbon-components-svelte/utils/id-scope.js";

  export let tooltipBase = "tip";

  createIdScope("app");

  // A header key that would collide with a slotted id under a bare prefix.
  const headers = [{ key: "search-0", value: "Name" }] as const;
  const rows = [{ id: "r1", "search-0": "Load balancer" }];
</script>

<Tooltip id={tooltipBase} triggerText="Hint" open>Body</Tooltip>
<Tabs>
  <Tab label="One" />
  <Tab label="Two" />
  <svelte:fragment slot="content">
    <TabContent>First</TabContent>
    <TabContent>Second</TabContent>
    <TabContent>Orphan</TabContent>
  </svelte:fragment>
</Tabs>
<DataTable id="t" {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch />
    </ToolbarContent>
  </Toolbar>
</DataTable>
