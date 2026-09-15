<script>
  import { Button, Dialog, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Accept terms</Button>

<Dialog bind:open modal closedby="none" aria-label="Accept terms">
  <Stack gap={5}>
    <p>
      Clicking the backdrop does not close this dialog. Use the button below to
      continue.
    </p>
    <Button on:click={() => (open = false)}>I agree</Button>
  </Stack>
</Dialog>
