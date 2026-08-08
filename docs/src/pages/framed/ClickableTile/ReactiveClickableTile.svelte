<script>
  import { ClickableTile, Stack } from "carbon-components-svelte";

  let clicked = false;
</script>

<Stack gap={5}>
  <div>Clicked: <strong>{clicked}</strong></div>
  <ClickableTile bind:clicked>Click this tile</ClickableTile>
</Stack>
