<script>
  import { Stack, TreeView } from "carbon-components-svelte";

  let activeId = 0;
  let selectedIds = [0];
  let expandedIds = [1];
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
</script>

<Stack gap={6}>
  <div>
    <TreeView
      multiselect
      multiselectMode="shallow"
      labelText="Cloud Products (shallow scope)"
      {nodes}
      bind:activeId
      bind:selectedIds
      bind:expandedIds
    />
  </div>
  <Stack gap={4}>
    <div>Active node id: {activeId}</div>
    <div>Selected ids: {JSON.stringify(selectedIds)}</div>
  </Stack>
</Stack>
