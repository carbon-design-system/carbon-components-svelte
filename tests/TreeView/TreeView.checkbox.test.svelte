<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  type Id = TreeNode["id"];

  export let selectionMode: ComponentProps<TreeView>["selectionMode"] =
    "checkbox";
  export let conduct: ComponentProps<TreeView>["conduct"] = true;
  export let multiselect: ComponentProps<TreeView>["multiselect"] = false;
  export let selectedIds: Id[] = [];
  export let indeterminateIds: ReadonlyArray<Id> = [];
  /** Spy for the aggregate `select:change` event. */
  export let onSelectChange: (detail: {
    selectedIds: ReadonlyArray<Id>;
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
  {conduct}
  {multiselect}
  expandedIds={["analytics", "blockchain"]}
  bind:selectedIds
  bind:indeterminateIds
  on:select:change={({ detail }) => onSelectChange(detail)}
/>
