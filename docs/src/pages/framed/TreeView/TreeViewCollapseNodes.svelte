<script>
  import { Button, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let expandedIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14];
  let nodes = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      disabled: true,
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          disabled: true,
          nodes: [
            { id: 3, text: "Apache Spark", disabled: true },
            { id: 4, text: "Hadoop", disabled: true },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query", disabled: true },
        { id: 6, text: "IBM Db2 Warehouse on Cloud", disabled: true },
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

<div>
  <Button
    on:click={() => {
      treeview?.collapseNodes((node) => node.disabled);
    }}
  >
    Collapse disabled nodes
  </Button>
</div>

<TreeView
  bind:this={treeview}
  bind:expandedIds
  labelText="Cloud Products"
  {nodes}
/>

<style>
  div {
    margin-bottom: var(--cds-spacing-05);
  }
</style>
