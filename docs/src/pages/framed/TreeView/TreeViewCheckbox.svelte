<script>
  import { Checkbox, Stack, TreeView } from "carbon-components-svelte";

  let checkedNodes = new Set([0, 7]);
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
        { id: 11, text: "IBM Cloud Databases for MongoDB" },
      ],
    },
  ];

  function handleCheck(nodeId) {
    if (checkedNodes.has(nodeId)) {
      checkedNodes.delete(nodeId);
    } else {
      checkedNodes.add(nodeId);
    }
    checkedNodes = checkedNodes;
  }
</script>

<Stack gap={3}>
  <TreeView labelText="Cloud Products" {nodes} let:node>
    <div on:click|stopPropagation on:keydown|stopPropagation role="none">
      <Checkbox
        labelText={node.text}
        checked={checkedNodes.has(node.id)}
        disabled={node.disabled}
        on:check={() => handleCheck(node.id)}
      />
    </div>
  </TreeView>
  <div>
    <strong>Checked node IDs:</strong>
    {Array.from(checkedNodes)}
  </div>
</Stack>
