<script>
  import { ColorPicker, Stack } from "carbon-components-svelte";

  let value = "#0f62fe";
  let format = "hex";
</script>

<Stack gap={5}>
  <ColorPicker bind:value bind:format />
  <p>
    <code>value</code>: {value}, <code>format</code>: {format}
  </p>
</Stack>
