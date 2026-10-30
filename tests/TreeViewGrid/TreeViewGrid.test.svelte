<script lang="ts">
  import TreeViewGrid from "carbon-components-svelte/TreeViewGrid/TreeViewGrid.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<TreeViewGrid>;
  type Server = {
    id: string;
    text: string;
    owner: string;
    status: string;
    disabled?: boolean;
    hasChildren?: boolean;
    nodes?: Server[];
  };

  export let nodes: Server[] = [
    {
      id: "prod",
      text: "Production",
      owner: "Ana",
      status: "live",
      nodes: [
        {
          id: "web",
          text: "Web",
          owner: "Ben",
          status: "live",
          nodes: [
            { id: "web-1", text: "web-1", owner: "Ben", status: "live" },
            { id: "web-2", text: "web-2", owner: "Ben", status: "stopped" },
          ],
        },
        {
          id: "cache",
          text: "Cache",
          owner: "Cy",
          status: "live",
          disabled: true,
        },
        { id: "db", text: "Database", owner: "Di", status: "live" },
      ],
    },
    {
      id: "stage",
      text: "Staging",
      owner: "Ana",
      status: "stopped",
      nodes: [{ id: "stage-api", text: "API", owner: "Eve", status: "live" }],
    },
    { id: "lone", text: "Sandbox", owner: "Fay", status: "stopped" },
  ];
  export let headers: NonNullable<Props["headers"]> = [
    { key: "text", value: "Name" },
    { key: "owner", value: "Owner" },
    { key: "status", value: "Status" },
  ];
  export let expandedIds: NonNullable<Props["expandedIds"]> = [];
  export let selectedIds: NonNullable<Props["selectedIds"]> = [];
  export let activeId: Props["activeId"] = "";
  export let multiselect = false;
  export let widgetNavigation: "arrow" | "tab" = "arrow";
  export let widgets = false;
  export let emptyText = "";
  export let log: Array<{ name: string; detail: unknown }> = [];

  function record(name: string) {
    return (event: CustomEvent) => log.push({ name, detail: event.detail });
  }
</script>

<TreeViewGrid
  labelText="Servers"
  {nodes}
  {headers}
  {multiselect}
  {widgetNavigation}
  {emptyText}
  bind:expandedIds
  bind:selectedIds
  bind:activeId
  on:select={record("select")}
  on:toggle={record("toggle")}
  on:focus={record("focus")}
  on:select:change={record("select:change")}
  on:toggle:change={record("toggle:change")}
>
  <svelte:fragment slot="cell" let:node let:cell let:cellIndex>
    {#if widgets && cell.key === "status"}
      <a href="#{node.id}">{cell.value}</a>
      <input type="checkbox" aria-label="Pin {node.text}" />
    {:else}
      {cell.display ? cell.display(cell.value, node) : cell.value}
    {/if}
  </svelte:fragment>
</TreeViewGrid>

<output data-testid="expanded">{expandedIds.join(",")}</output>
<output data-testid="selected">{selectedIds.join(",")}</output>
