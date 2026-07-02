<script>
  import { Button, Dialog } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open non-modal dialog</Button>

<Dialog bind:open aria-label="Example non-modal dialog">
  <p>This dialog has no backdrop. The page behind it stays interactive.</p>
  <Button on:click={() => (open = false)}>Close</Button>
</Dialog>
