<script>
  import { Stack, TreeView } from "carbon-components-svelte";

  let lastEvent = null;
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
    <TreeView
      labelText="Cloud Products"
      {nodes}
      on:select={({ detail }) => logEvent("select", detail)}
      on:toggle={({ detail }) => logEvent("toggle", detail)}
      on:focus={({ detail }) => logEvent("focus", detail)}
    />
  </div>
  {#if lastEvent}
    <Stack gap={4}>
      <div>Last event: {lastEvent.type}</div>
      <div>Node: {lastEvent.text} (id: {lastEvent.id})</div>
      <div>detail.expanded: {lastEvent.expanded}</div>
      <div>detail.selected: {lastEvent.selected}</div>
    </Stack>
  {/if}
</Stack>
