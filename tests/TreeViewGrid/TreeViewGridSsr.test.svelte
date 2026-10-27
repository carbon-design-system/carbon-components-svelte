<script lang="ts">
  import TreeViewGrid from "carbon-components-svelte/TreeViewGrid/TreeViewGrid.svelte";

  export let firstDisabled = false;
  export let expandedIds: string[] = [];
  export let activeId = "";
</script>

<TreeViewGrid
  labelText="Files"
  headers={[
    { key: "text", value: "Name" },
    { key: "size", value: "Size" },
  ]}
  nodes={[
    { id: "a", text: "Reports", size: "1 KB", disabled: firstDisabled },
    {
      id: "b",
      text: "Invoices",
      size: "2 KB",
      nodes: [{ id: "b1", text: "2026", size: "3 KB" }],
    },
    { id: "c", text: "Archive", size: "4 KB" },
  ]}
  {expandedIds}
  {activeId}
/>
