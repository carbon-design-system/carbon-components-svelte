<script>
  import { RecursiveList, Stack, TreeView } from "carbon-components-svelte";

  let nodes = [
    { id: 0, text: "AI / Machine learning", editable: false },
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

  function renameNode(items, id, text) {
    return items.map((item) => {
      if (item.id === id) return { ...item, text };
      if (item.nodes) {
        return { ...item, nodes: renameNode(item.nodes, id, text) };
      }
      return item;
    });
  }
</script>

<Stack gap={6}>
  <div>
    <TreeView
      labelText="Cloud Products"
      editable
      {nodes}
      on:rename={({ detail }) => {
        nodes = renameNode(nodes, detail.id, detail.text);
      }}
    />
  </div>
  <RecursiveList {nodes} />
</Stack>
