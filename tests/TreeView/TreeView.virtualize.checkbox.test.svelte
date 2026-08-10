<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type Id = TreeNode["id"];

  export let checkMode: ComponentProps<TreeView>["checkMode"] = "deep";
  export let checkedIds: Id[] = [];
  export let indeterminateIds: ReadonlyArray<Id> = [];
  /** Spy for the aggregate `check:change` event. */
  export let onCheckChange: (detail: {
    checkedIds: ReadonlyArray<Id>;
    added: Id[];
    removed: Id[];
    indeterminateIds: ReadonlyArray<Id>;
  }) => void = () => {};

  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        { id: "spark", text: "Apache Spark" },
        { id: "hadoop", text: "Hadoop" },
        { id: "legacy", text: "Legacy warehouse", disabled: true },
      ],
    },
    {
      id: "blockchain",
      text: "Blockchain",
      nodes: [{ id: "platform", text: "IBM Blockchain Platform" }],
    },
    { id: "docs", text: "Documentation", href: "/docs" },
  ];

  // Pad with enough collapsed roots that windowing is active, while keeping
  // the interactive subtree near the top of the viewport.
  const paddingRoots: TreeNode[] = Array.from({ length: 80 }, (_, i) => ({
    id: `pad-${i}`,
    text: `Padding ${i}`,
    nodes: [{ id: `pad-${i}-child`, text: `Padding ${i} child` }],
  }));

  $: allNodes = [...nodes, ...paddingRoots];
</script>

<TreeView
  labelText="Permissions"
  nodes={allNodes}
  selectionMode="checkbox"
  {checkMode}
  expandedIds={["analytics", "blockchain"]}
  virtualize={{ maxVisibleRows: 10 }}
  bind:checkedIds
  bind:indeterminateIds
  on:check:change={({ detail }) => onCheckChange(detail)}
/>
