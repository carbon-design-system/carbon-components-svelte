<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Preview session timeout</Button>

<Dialog
  bind:open
  modal
  aria-label="Session timeout warning"
  on:open={() => console.log("open")}
  on:close={(e) => console.log("close", e.detail)}
>
  <Stack gap={5}>
    <p>Your session will expire in 2 minutes due to inactivity.</p>
    <form method="dialog">
      <Button type="submit">Close</Button>
    </form>
  </Stack>
</Dialog>
