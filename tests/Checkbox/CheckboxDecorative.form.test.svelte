<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let checkedIds: number[] = [1];
  export let selectedIds: string[] = ["a"];

  const nodes = [
    { id: 1, text: "Read" },
    { id: 2, text: "Write" },
  ];
  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
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
  <div data-testid="multiselect">
    <MultiSelect open labelText="Tags" {items} bind:selectedIds />
  </div>
</form>
