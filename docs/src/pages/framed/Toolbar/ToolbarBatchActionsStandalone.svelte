<script>
  import {
    Toolbar,
    ToolbarContent,
    ToolbarBatchActions,
    Button,
    Checkbox,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  let items = [
    { id: 1, name: "Item 1", checked: false },
    { id: 2, name: "Item 2", checked: false },
    { id: 3, name: "Item 3", checked: false },
  ];
  let nextId = items.length + 1;

  $: selectedIds = items.filter((item) => item.checked).map((item) => item.id);
</script>

<Toolbar>
  <ToolbarBatchActions
    {selectedIds}
    on:cancel={() => {
      items = items.map((item) => ({ ...item, checked: false }));
    }}
  >
    <Button
      kind="danger"
      icon={TrashCan}
      on:click={() => {
        items = items.filter((item) => !item.checked);
      }}
    >
      Delete
    </Button>
  </ToolbarBatchActions>
  <ToolbarContent>
    <Button
      icon={Add}
      size="small"
      on:click={() => {
        items = [
          ...items,
          { id: nextId, name: "Item " + nextId, checked: false },
        ];
        nextId++;
      }}
    >
      Add item
    </Button>
  </ToolbarContent>
</Toolbar>

<div style:margin-top="var(--cds-layout-02)">
  {#each items as item (item.id)}
    <Checkbox labelText={item.name} bind:checked={item.checked} />
  {/each}
</div>
