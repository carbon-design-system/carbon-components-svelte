<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type Id = TreeNode["id"];

  export let selectionMode: ComponentProps<TreeView>["selectionMode"] =
    "checkbox";
  export let checkMode: ComponentProps<TreeView>["checkMode"] = "deep";
  export let multiselect: ComponentProps<TreeView>["multiselect"] = false;
  export let checkedIds: Id[] = [];
  export let indeterminateIds: ReadonlyArray<Id> = [];
  /** Spy for the aggregate `check:change` event. */
  export let onCheckChange: (detail: {
    checkedIds: ReadonlyArray<Id>;
    added: Id[];
    removed: Id[];
    indeterminateIds: ReadonlyArray<Id>;
  }) => void = () => {};

  export let nodes: ComponentProps<TreeView>["nodes"] = [
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
</script>

<TreeView
  labelText="Permissions"
  {nodes}
  {selectionMode}
  {checkMode}
  {multiselect}
  expandedIds={["analytics", "blockchain"]}
  bind:checkedIds
  bind:indeterminateIds
  on:check:change={({ detail }) => onCheckChange(detail)}
/>
