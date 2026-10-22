<script>
  import { Button, ButtonSet, Stack, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let activeId = "";
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
  <ButtonSet>
    <Button
      disabled={activeId === ""}
      on:click={() => treeview?.editNode(activeId)}
    >
      Rename active node
    </Button>
    <Button kind="tertiary" on:click={() => treeview?.editNode(3)}>
      Rename a collapsed node
    </Button>
  </ButtonSet>
  <div>
    <TreeView
      bind:this={treeview}
      bind:activeId
      labelText="Cloud Products"
      editable
      {nodes}
      on:rename={({ detail }) => {
        nodes = renameNode(nodes, detail.id, detail.text);
      }}
    />
  </div>
</Stack>
