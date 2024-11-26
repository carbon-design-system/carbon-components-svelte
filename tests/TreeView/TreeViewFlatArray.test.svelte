<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Button, TreeView } from "carbon-components-svelte";
  import type { TreeNodeId } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import WatsonMachineLearning from "carbon-icons-svelte/lib/WatsonMachineLearning.svelte";
  import Blockchain from "carbon-icons-svelte/lib/Blockchain.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import SignalStrength from "carbon-icons-svelte/lib/SignalStrength.svelte";

  let treeview: TreeView;
  let activeId: TreeNodeId = "";
  let selectedIds: TreeNodeId[] = [];
  let expandedIds: TreeNodeId[] = [1];

  let nodesFlat: ComponentProps<TreeView>["nodesFlat"] = [
    { id: 0, text: "AI / Machine learning", icon: WatsonMachineLearning },
    { id: 1, text: "Analytics", icon: Analytics },
    { id: 2, text: "IBM Analytics Engine", pid: 1, icon: Analytics },
    { id: 3, text: "Apache Spark", pid: 2, icon: Analytics },
    { id: 4, text: "Hadoop", icon: Analytics, pid: 2 },
    { id: 5, text: "IBM Cloud SQL Query", icon: Analytics, pid: 1 },
    { id: 6, text: "IBM Db2 Warehouse on Cloud", icon: Analytics, pid: 1 },
    { id: 7, text: "Blockchain", icon: Blockchain },
    { id: 8, text: "IBM Blockchain Platform", icon: Blockchain, pid: 7 },
    { id: 9, text: "Databases", icon: DataBase },
    {
      id: 10,
      text: "IBM Cloud Databases for Elasticsearch",
      icon: DataBase,
      pid: 9,
    },
    {
      id: 11,
      text: "IBM Cloud Databases for Enterprise DB",
      icon: DataBase,
      pid: 9,
    },
    { id: 12, text: "IBM Cloud Databases for MongoDB", icon: DataBase, pid: 9 },
    {
      id: 13,
      text: "IBM Cloud Databases for PostgreSQL",
      icon: DataBase,
      pid: 9,
    },
    { id: 14, text: "Integration", icon: SignalStrength, disabled: true },
    {
      id: 15,
      text: "IBM API Connect",
      icon: SignalStrength,
      disabled: true,
      pid: 14,
    },
  ];

  $: console.log("selectedIds", selectedIds);
</script>

<TreeView
  bind:this={treeview}
  size="compact"
  labelText="Cloud Products"
  {nodesFlat}
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
