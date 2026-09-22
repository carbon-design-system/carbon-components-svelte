<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>View item details</Button>

<Dialog bind:open modal light aria-label="Item details">
  <Stack gap={5}>
    <p>The light variant sits on a lighter surface than the default.</p>
    <Button on:click={() => (open = false)}>Close</Button>
  </Stack>
</Dialog>
