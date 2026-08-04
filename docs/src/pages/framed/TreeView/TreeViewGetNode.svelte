<script>
  import { Stack, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let activeId = "";
  let selectedIds = [];
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

  $: activeNode = treeview?.getNode(activeId) ?? null;
  $: selectedNodes = treeview?.getNodes(selectedIds) ?? [];
</script>

<Stack gap={6}>
  <div>
    <TreeView
      bind:this={treeview}
      multiselect
      labelText="Cloud Products"
      {nodes}
      bind:activeId
      bind:selectedIds
    />
  </div>
  <Stack gap={4}>
    <div>Active node: {activeNode ? activeNode.text : "(none)"}</div>
    <div>
      Selected nodes:
      {selectedNodes.map((node) => node.text).join(", ") ||
        "(none)"}
    </div>
  </Stack>
</Stack>
