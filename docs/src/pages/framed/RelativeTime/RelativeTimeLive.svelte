<script>
  import { Button, RelativeTime, Stack } from "carbon-components-svelte";

  let savedAt = Date.now();

  function handleSave() {
    savedAt = Date.now();
  }
</script>

<Stack gap={5}>
  <Button on:click={handleSave}>Save</Button>
  <RelativeTime date={savedAt} let:formatted>Saved {formatted}</RelativeTime>
</Stack>
