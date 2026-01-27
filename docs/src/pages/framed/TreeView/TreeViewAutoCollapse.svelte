<script>
  import { Button, ButtonSet, Stack, TreeView } from "carbon-components-svelte";

  let activeId = "";
  let selectedIds = [];
  let expandedIds = [];
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
    {
      id: 9,
      text: "Databases",
      nodes: [
        { id: 10, text: "IBM Cloud Databases for Elasticsearch" },
        { id: 11, text: "IBM Cloud Databases for Enterprise DB" },
        { id: 12, text: "IBM Cloud Databases for MongoDB" },
        { id: 13, text: "IBM Cloud Databases for PostgreSQL" },
      ],
    },
    {
      id: 14,
      text: "Integration",
      nodes: [{ id: 15, text: "IBM API Connect" }],
    },
  ];
</script>

<Stack gap={4}>
  <ButtonSet>
    <Button size="small" on:click={() => (activeId = 3)}>Select Spark</Button>
    <Button size="small" on:click={() => (activeId = 8)}
      >Select Blockchain</Button
    >
    <Button size="small" on:click={() => (activeId = 12)}>Select MongoDB</Button
    >
  </ButtonSet>

  <TreeView
    labelText="Cloud Products"
    {nodes}
    bind:activeId
    bind:selectedIds
    bind:expandedIds
    autoCollapse={true}
    on:select={({ detail }) => console.log("select", detail)}
    on:toggle={({ detail }) => console.log("toggle", detail)}
    on:focus={({ detail }) => console.log("focus", detail)}
  />

  <div>Active node id: {activeId}</div>
  <div>Selected ids: {JSON.stringify(selectedIds)}</div>
  <div>Expanded ids: {JSON.stringify(expandedIds)}</div>
</Stack>
