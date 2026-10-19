<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let checkedIds: number[] = [1];

  const nodes = [
    { id: 1, text: "Read" },
    { id: 2, text: "Write" },
  ];
</script>

<form data-testid="form">
  <div data-testid="tree">
    <TreeView
      labelText="Permissions"
      selectionMode="checkbox"
      {nodes}
      bind:checkedIds
    />
  </div>
</form>
