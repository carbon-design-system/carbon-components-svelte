<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let autoCollapse = false;
  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [];

  /** Spy for the aggregate `toggle:change` event. */
  export let onToggleChange: (detail: {
    expandedIds: ReadonlyArray<string | number>;
    added: Array<string | number>;
    removed: Array<string | number>;
  }) => void = () => {};
  /** Spy for the per-node `toggle` event. */
  export let onToggle: (detail: unknown) => void = () => {};

  let treeview: TreeView;
  let activeId: ComponentProps<TreeView>["activeId"] = "";
  let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];
  let nodes: ComponentProps<TreeView>["nodes"] = [
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
      ],
    },
  ];
</script>

<TreeView
  bind:this={treeview}
  {autoCollapse}
  labelText="Expanded change"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:toggle={({ detail }) => onToggle(detail)}
  on:toggle:change={({ detail }) => onToggleChange(detail)}
  let:node
>
  {node.text}
</TreeView>

<Button data-testid="expand-all" on:click={() => treeview.expandAll()}>
  Expand all
</Button>
<Button data-testid="collapse-all" on:click={() => treeview.collapseAll()}>
  Collapse all
</Button>
<Button
  data-testid="expand-nodes"
  on:click={() => treeview.expandNodes((node) => node.id === 1)}
>
  Expand Analytics
</Button>
<Button
  data-testid="collapse-nodes"
  on:click={() => treeview.collapseNodes((node) => node.id === 1)}
>
  Collapse Analytics
</Button>
<Button
  data-testid="show-node"
  on:click={() => treeview.showNode(3, { focus: false })}
>
  Show Apache Spark
</Button>
<Button data-testid="set-prop" on:click={() => (expandedIds = [1])}>
  Set expanded via prop
</Button>
<Button
  data-testid="noop-set"
  on:click={() => (expandedIds = (expandedIds ?? []).slice())}
>
  No-op set
</Button>
<Button data-testid="select-only" on:click={() => (activeId = 0)}>
  Select only
</Button>
<Button data-testid="auto-collapse" on:click={() => (activeId = 2)}>
  Activate nested node
</Button>
