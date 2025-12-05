<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "Node 1" },
    { id: 1, text: "Node 2" },
  ];
</script>

<TreeView {nodes} labelText="Default label">
  <span slot="labelChildren">Custom label content</span>
</TreeView>
