<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { TreeView } from "carbon-components-svelte";
  import type { TreeNodeId } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";

  let treeview: TreeView;
  let activeId: TreeNodeId = "";
  let selectedIds: TreeNodeId[] = [];
  let expandedIds: TreeNodeId[] = [1];
  let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "AI / Machine learning", icon: Analytics },
    {
      id: 1,
      text: 0,
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

  $: if (treeview) {
    treeview.expandAll();
    treeview.expandNodes((node) => {
      return +node.id > 0;
    });
    treeview.collapseAll();
    treeview.collapseNodes((node) => {
      return node.disabled === true;
    });
    treeview.showNode(1);
  }
</script>

<TreeView
  bind:this="{treeview}"
  size="compact"
  labelText="Cloud Products"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:select="{({ detail }) => console.log('select', detail)}"
  on:toggle="{({ detail }) => console.log('toggle', detail)}"
  on:focus="{({ detail }) => console.log('focus', detail)}"
  let:node
>
  {node.id}
  {node.disabled}
  {node.expanded}
  {node.leaf}
  {node.selected}
  {node.text}
</TreeView>
