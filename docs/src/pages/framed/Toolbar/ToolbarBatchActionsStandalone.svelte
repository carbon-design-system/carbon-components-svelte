<script>
  import {
    Button,
    Checkbox,
    Stack,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let items = [
    { id: 1, name: "Load Balancer 1", checked: false },
    { id: 2, name: "Load Balancer 2", checked: false },
    { id: 3, name: "Load Balancer 3", checked: false },
  ];
  let nextId = items.length + 1;

  $: selectedIds = items.filter((item) => item.checked).map((item) => item.id);
</script>

<Stack gap={6}>
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
            { id: nextId, name: `Load Balancer ${nextId}`, checked: false },
          ];
          nextId++;
        }}
      >
        Add balancer
      </Button>
    </ToolbarContent>
  </Toolbar>
  <Stack>
    {#each items as item (item.id)}
      <Checkbox labelText={item.name} bind:checked={item.checked} />
    {/each}
  </Stack>
</Stack>
