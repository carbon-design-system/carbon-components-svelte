<script>
  import { Button, Stack, TreeView } from "carbon-components-svelte";

  let treeview = null;
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
      disabled: true,
      nodes: [{ id: 15, text: "IBM API Connect", disabled: true }],
    },
  ];
</script>

<Stack gap={5}>
  <div>
    <Button
      on:click={() => {
        treeview?.expandNodes((node) => /^IBM/.test(node.text));
      }}
    >
      Expand nodes starting with "IBM"
    </Button>
  </div>
  <TreeView bind:this={treeview} labelText="Cloud Products" {nodes} />
</Stack>
