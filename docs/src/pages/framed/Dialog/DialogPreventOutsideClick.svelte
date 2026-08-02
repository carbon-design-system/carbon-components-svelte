<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open dialog</Button>

<Dialog
  preventCloseOnClickOutside
  bind:open
  modal
  aria-label="Prevent outside click example"
>
  <Stack gap={5}>
    <p>
      Clicking the backdrop will not close this dialog. Use
      <kbd>Escape</kbd>
      or the close button.
    </p>
    <form method="dialog">
      <Button type="submit">Close</Button>
    </form>
  </Stack>
</Dialog>
