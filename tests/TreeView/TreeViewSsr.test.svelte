<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let firstDisabled = false;
</script>

<TreeView
  labelText="Files"
  nodes={[
    { id: "a", text: "Reports", disabled: firstDisabled },
    { id: "b", text: "Invoices", nodes: [{ id: "b1", text: "2026" }] },
    { id: "c", text: "Archive" },
  ]}
/>
