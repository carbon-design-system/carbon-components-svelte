<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarColumnVisibility from "carbon-components-svelte/DataTable/ToolbarColumnVisibility.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import type { ComponentProps } from "svelte";

  export let headers: ComponentProps<ToolbarColumnVisibility>["headers"] = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "actions", empty: true },
  ];
  export let toggleableKeys: ComponentProps<ToolbarColumnVisibility>["toggleableKeys"] =
    undefined;
  export let open: ComponentProps<ToolbarColumnVisibility>["open"] = false;
  export let change: ((event: CustomEvent) => void) | undefined = undefined;

  const rows = [
    { id: "a", name: "Load Balancer 1", protocol: "HTTP", port: 443 },
  ];
</script>

<div data-testid="headers-snapshot">
  {JSON.stringify(
    (headers ?? []).map((header) => [header.key, !!header.columnHidden]),
  )}
</div>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarColumnVisibility
        bind:headers
        bind:open
        {toggleableKeys}
        on:change={(event) => change?.(event)}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>
