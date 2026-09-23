<script>
  import { Slider, Stack } from "carbon-components-svelte";

  let gap = 5;
</script>

<Stack gap={6}>
  <Slider
    labelText="Gap"
    min={0}
    max={13}
    minLabel="0"
    maxLabel="13"
    bind:value={gap}
  />

  <Stack orientation="horizontal" {gap}>
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </Stack>
</Stack>
