<script lang="ts">
  import { Button, TreeView } from "carbon-components-svelte";
  import type { TreeNodeId } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import { toHierarchy } from "../../src/utils/toHierarchy";

  let treeview: TreeView;
  let activeId: TreeNodeId = "";
  let selectedIds: TreeNodeId[] = [];
  let expandedIds: TreeNodeId[] = [];
  let nodes = toHierarchy(
    [
      { id: 0, text: "AI / Machine learning", icon: Analytics },
      { id: 1, text: "Analytics" },
      { id: 2, text: "IBM Analytics Engine", pid: 1 },
      { id: 3, text: "Apache Spark", pid: 2 },
      { id: 4, text: "Hadoop", pid: 2 },
      { id: 5, text: "IBM Cloud SQL Query", pid: 1 },
      { id: 6, text: "IBM Db2 Warehouse on Cloud", pid: 1 },
      { id: 7, text: "Blockchain" },
      { id: 8, text: "IBM Blockchain Platform", pid: 7 },
      { id: 9, text: "Databases" },
      { id: 10, text: "IBM Cloud Databases for Elasticsearch", pid: 9 },
      { id: 11, text: "IBM Cloud Databases for Enterprise DB", pid: 9 },
      { id: 12, text: "IBM Cloud Databases for MongoDB", pid: 9 },
      { id: 13, text: "IBM Cloud Databases for PostgreSQL", pid: 9 },
      { id: 14, text: "Integration", disabled: true },
      { id: 15, text: "IBM API Connect", disabled: true, pid: 14 },
    ],
    (node) => node.pid,
  );

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
<Button
  on:click={() => {
    treeview.expandNodes((node) => {
      return /^IBM/.test(node.text);
    });
  }}
>
  Expand some nodes
</Button>
