<svelte:options accessors />

<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type Id = TreeNode["id"];

  let treeview: TreeView;
  export function showNode(...args: Parameters<TreeView["showNode"]>) {
    treeview.showNode(...args);
  }

  export let selectionMode: ComponentProps<TreeView>["selectionMode"] =
    "checkbox";
  export let checkMode: ComponentProps<TreeView>["checkMode"] = "deep";
  export let multiselect: ComponentProps<TreeView>["multiselect"] = false;
  export let checkedIds: Id[] = [];
  export let indeterminateIds: ReadonlyArray<Id> = [];
  export let virtualize: ComponentProps<TreeView>["virtualize"] = undefined;
  /** Collapsed roots appended after `nodes`, so windowing is active. */
  export let padding = 0;
  /** Spy for the per-node `check` event. */
  export let onCheck: (detail: unknown) => void = () => {};
  /** Spy for the per-node `select` event, fired by link rows. */
  export let onSelect: (detail: unknown) => void = () => {};
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

  // Pad with collapsed roots so windowing is active while the interactive
  // subtree stays near the top of the viewport.
  $: allNodes = [
    ...nodes,
    ...Array.from({ length: padding }, (_, i) => ({
      id: `pad-${i}`,
      text: `Padding ${i}`,
      nodes: [{ id: `pad-${i}-child`, text: `Padding ${i} child` }],
    })),
  ];
</script>

<TreeView
  bind:this={treeview}
  labelText="Permissions"
  nodes={allNodes}
  {selectionMode}
  {checkMode}
  {multiselect}
  expandedIds={["analytics", "blockchain"]}
  {virtualize}
  bind:checkedIds
  bind:indeterminateIds
  on:check={({ detail }) => onCheck(detail)}
  on:select={({ detail }) => onSelect(detail)}
  on:check:change={({ detail }) => onCheckChange(detail)}
/>
