<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal dialog</Button>

<Dialog
  bind:open
  modal
  aria-label="Example modal dialog"
  on:open={() => console.log("open")}
  on:close={(e) => console.log("close", e.detail)}
>
  <Stack gap={5}>
    <p>Dialog content.</p>
    <form method="dialog">
      <Button type="submit">Close</Button>
    </form>
  </Stack>
</Dialog>
