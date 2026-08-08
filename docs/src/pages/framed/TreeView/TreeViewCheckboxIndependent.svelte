<script>
  import { Stack, TreeView } from "carbon-components-svelte";

  let selectedIds = [1, 3];
  let indeterminateIds = [];
  let expandedIds = [1, 2, 7];
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
      selectionMode="checkbox"
      conduct={false}
      labelText="Cloud Products (independent)"
      {nodes}
      bind:selectedIds
      bind:indeterminateIds
      bind:expandedIds
    />
  </div>
  <Stack gap={4}>
    <div>Checked ids: {JSON.stringify(selectedIds)}</div>
    <div>Indeterminate ids: {JSON.stringify(indeterminateIds)}</div>
  </Stack>
</Stack>
