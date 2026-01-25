<script lang="ts">
  import { Button, TreeView } from "carbon-components-svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import type { ComponentProps } from "svelte";

  let treeview: TreeView;
  let activeId: string | number = "";
  let selectedIds: (string | number)[] = [];
  let expandedIds: (string | number)[] = [];
  let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "AI / Machine learning", icon: Analytics },
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

  $: console.log("selectedIds", selectedIds);
</script>

<TreeView
  bind:this={treeview}
  size="compact"
  labelText="Cloud Products"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:select={({ detail }) => console.log("select", detail)}
  on:toggle={({ detail }) => console.log("toggle", detail)}
  on:focus={({ detail }) => console.log("focus", detail)}
  let:node
>
  {node.text}
</TreeView>

<Button on:click={treeview.expandAll}>Expand all</Button>
<Button on:click={treeview.collapseAll}>Collapse all</Button>
<Button
  on:click={() => {
    treeview.expandNodes((node) => {
      return /^IBM/.test(node.text);
    });
  }}
>
  Expand some nodes
</Button>
<Button
  on:click={() => {
    treeview.collapseNodes((node) => {
      return /^IBM/.test(node.text);
    });
  }}
>
  Collapse some nodes
</Button>
