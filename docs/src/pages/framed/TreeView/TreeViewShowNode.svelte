<script>
  import { Button, ButtonSet, TreeView } from "carbon-components-svelte";

  const nodeSpark = { id: 3, text: "Apache Spark" };
  const nodeBlockchain = { id: 8, text: "IBM Blockchain Platform" };

  let treeview = null;
  let children = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      children: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          children: [nodeSpark, { id: 4, text: "Hadoop" }],
        },
        { id: 5, text: "IBM Cloud SQL Query" },
        { id: 6, text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      children: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
  ];
</script>

<ButtonSet style="margin-bottom: var(--bx-spacing-05)">
  {#each [nodeSpark, nodeBlockchain] as { id, text }}
    <Button
      on:click="{() => {
        treeview?.showNode(id);
      }}"
    >
      Show "{text}"
    </Button>
  {/each}
  <Button kind="tertiary" on:click="{treeview.collapseAll}">Collapse all</Button
  >
</ButtonSet>

<TreeView
  bind:this="{treeview}"
  labelText="Cloud Products"
  children="{children}"
/>
