<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let virtualize: ComponentProps<TreeView>["virtualize"] = undefined;
  export let autoCollapse = false;
  export let onToggle: (id: string | number) => void = () => {};

  const nodes = [
    { id: "a", text: "Alpha", nodes: [{ id: "a-1", text: "Alpha child" }] },
    {
      id: "b",
      text: "Beta",
      nodes: [
        {
          id: "b-1",
          text: "Beta folder",
          nodes: [{ id: "b-1-1", text: "Deep" }],
        },
      ],
    },
    { id: "c", text: "Gamma", hasChildren: true },
    { id: "d", text: "Delta leaf" },
    {
      id: "e",
      text: "Epsilon",
      disabled: true,
      nodes: [{ id: "e-1", text: "Epsilon child" }],
    },
  ];
</script>

<TreeView
  labelText="Siblings"
  {nodes}
  {virtualize}
  {autoCollapse}
  expandedIds={["a"]}
  on:toggle={({ detail }) => onToggle(detail.id)}
/>
