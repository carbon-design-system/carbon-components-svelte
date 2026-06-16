<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type Id = TreeNode["id"];

  export let multiselect: ComponentProps<TreeView>["multiselect"] = false;
  export let multiselectMode: ComponentProps<TreeView>["multiselectMode"] =
    "node";
  export let selectedIds: Id[] = [];
  export let expandedIds: Id[] = [];
  /** Spy for the aggregate `select:change` event. */
  export let onSelectChange: (detail: {
    selectedIds: ReadonlyArray<Id>;
    added: Id[];
    removed: Id[];
  }) => void = () => {};

  let treeview: TreeView;
  export let nodes: ComponentProps<TreeView>["nodes"] = [
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

<TreeView
  bind:this={treeview}
  labelText="Cloud Products"
  {multiselect}
  {multiselectMode}
  {nodes}
  bind:selectedIds
  bind:expandedIds
  on:select:change={({ detail }) => onSelectChange(detail)}
/>

<Button data-testid="set-selected" on:click={() => (selectedIds = [0, 7])}>
  Set selected
</Button>
<Button
  data-testid="set-same"
  on:click={() => (selectedIds = [...selectedIds])}
>
  Set same
</Button>
<Button data-testid="expand-all" on:click={() => treeview.expandAll()}>
  Expand all
</Button>
<Button
  data-testid="show-node-select"
  on:click={() => treeview.showNode(8, { select: true })}
>
  Show node select
</Button>
