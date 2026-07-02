<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open dialog</Button>

<Dialog bind:open aria-label="Example dialog">
  <Stack gap={5}>
    <p>This dialog has no backdrop. The page behind it stays interactive.</p>
    <Button on:click={() => (open = false)}>Close</Button>
  </Stack>
</Dialog>
