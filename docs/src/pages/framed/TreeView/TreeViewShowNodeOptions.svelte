<script>
  import { Button, ButtonSet, TreeView } from "carbon-components-svelte";

  const targetNode = { id: 3, text: "Apache Spark" };
  const targetNodeSelect = { id: 0, text: "AI / Machine learning" };

  let treeview = null;
  let key = 0;
  let nodes = [
    targetNodeSelect,
    {
      id: 1,
      text: "Analytics",
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          nodes: [targetNode, { id: 4, text: "Hadoop" }],
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
  <Button
    on:click={() => {
      treeview?.showNode(targetNode.id);
    }}
  >
    Default (expand + select + focus)
  </Button>
  <Button
    on:click={() => {
      treeview?.showNode(targetNode.id, {
        select: false,
        focus: false,
      });
    }}
  >
    Expand only
  </Button>
  <Button
    on:click={() => {
      treeview?.showNode(targetNodeSelect.id, {
        expand: false,
        focus: false,
      });
    }}
  >
    Select only
  </Button>
  <Button kind="tertiary" on:click={() => key++}>Reset</Button>
</ButtonSet>

{#key key}
  <TreeView bind:this={treeview} labelText="Cloud Products" {nodes} />
{/key}
