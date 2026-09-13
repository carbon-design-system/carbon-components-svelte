<script>
  import { ClickableTile, Stack } from "carbon-components-svelte";

  let clicked = false;
</script>

<Stack gap={5}>
  <div>Acknowledged: <strong>{clicked}</strong></div>
  <ClickableTile bind:clicked>Acknowledge incident</ClickableTile>
</Stack>
