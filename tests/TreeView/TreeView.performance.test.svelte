<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        { id: 2, text: "IBM Analytics Engine" },
        { id: 5, text: "IBM Cloud SQL Query" },
      ],
    },
  ];
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];
  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [];
</script>

<TreeView {nodes} {selectedIds} {expandedIds} />

