<script>
  import { announce, Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;

  function save(event) {
    // A native modal dialog takes everything outside it out of the
    // accessibility tree. `source` puts the message inside the dialog.
    announce("Saved the deployment.", { source: event.currentTarget });
  }
</script>

<Button on:click={() => (open = true)}>Edit deployment</Button>

<Dialog bind:open modal aria-label="Edit deployment">
  <Stack gap={4}>
    <p>Edit the deployment's settings.</p>
    <Stack orientation="horizontal" gap={4}>
      <Button on:click={save}>Save</Button>
      <Button kind="secondary" on:click={() => (open = false)}>Close</Button>
    </Stack>
  </Stack>
</Dialog>
