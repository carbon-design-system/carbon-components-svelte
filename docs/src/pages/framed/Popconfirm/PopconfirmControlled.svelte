<script>
  import { Button, Popconfirm, Stack } from "carbon-components-svelte";

  let open = false;
  let log = "Waiting";
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Popconfirm
    bind:open
    title="Archive this project?"
    kind="info"
    confirmText="Archive"
    on:confirm={() => (log = "Archived")}
    on:cancel={(e) => (log = `Cancelled: ${e.detail.trigger}`)}
  >
    <Button kind="tertiary" size="small">Archive</Button>
  </Popconfirm>
  <Button size="small" on:click={() => (open = true)}>Open from here</Button>
  <span>{log}</span>
</Stack>
