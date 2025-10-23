<script>
  import { Button, ButtonSet, TreeView } from "carbon-components-svelte";

  const nodeSpark = { id: 3, text: "Apache Spark" };
  const nodeBlockchain = { id: 8, text: "IBM Blockchain Platform" };

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
          nodes: [nodeSpark, { id: 4, text: "Hadoop" }],
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

<ButtonSet style="margin-bottom: var(--cds-spacing-05)">
  {#each [nodeSpark, nodeBlockchain] as { id, text }}
    <Button
      on:click={() => {
        treeview?.selectNode(id);
      }}
    >
      Select "{text}"
    </Button>
  {/each}
</ButtonSet>

<TreeView bind:this={treeview} labelText="Cloud Products" {nodes} />
