<script>
  import { Button, Stack, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let lastEvent = null;
  let lastToggleChange = null;
  let lastSelectChange = null;
  let nodes = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          nodes: [
            { id: 3, text: "Apache Spark" },
            { id: 4, text: "Hadoop" },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query" },
        { id: 6, text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      nodes: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
  ];

  function logEvent(type, detail) {
    lastEvent = {
      type,
      id: detail.id,
      text: detail.text,
      expanded: detail.expanded,
      selected: detail.selected,
    };
  }
</script>

<Stack gap={6}>
  <div>
    <Button on:click={() => treeview?.expandAll()}>Expand all</Button>
    <Button kind="secondary" on:click={() => treeview?.collapseAll()}>
      Collapse all
    </Button>
  </div>
  <div>
    <TreeView
      bind:this={treeview}
      multiselect
      labelText="Cloud Products"
      {nodes}
      on:select={({ detail }) => logEvent("select", detail)}
      on:toggle={({ detail }) => logEvent("toggle", detail)}
      on:focus={({ detail }) => logEvent("focus", detail)}
      on:toggle:change={({ detail }) => (lastToggleChange = detail)}
      on:select:change={({ detail }) => (lastSelectChange = detail)}
    />
  </div>
  {#if lastEvent}
    <Stack gap={4}>
      <div>Last node event: {lastEvent.type}</div>
      <div>Node: {lastEvent.text} (id: {lastEvent.id})</div>
      <div>detail.expanded: {lastEvent.expanded}</div>
      <div>detail.selected: {lastEvent.selected}</div>
    </Stack>
  {/if}
  {#if lastToggleChange}
    <Stack gap={4}>
      <div>Last toggle:change</div>
      <div>expandedIds: {JSON.stringify(lastToggleChange.expandedIds)}</div>
      <div>added: {JSON.stringify(lastToggleChange.added)}</div>
      <div>removed: {JSON.stringify(lastToggleChange.removed)}</div>
    </Stack>
  {/if}
  {#if lastSelectChange}
    <Stack gap={4}>
      <div>Last select:change</div>
      <div>selectedIds: {JSON.stringify(lastSelectChange.selectedIds)}</div>
      <div>added: {JSON.stringify(lastSelectChange.added)}</div>
      <div>removed: {JSON.stringify(lastSelectChange.removed)}</div>
    </Stack>
  {/if}
</Stack>
