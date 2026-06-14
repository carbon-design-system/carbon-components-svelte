<script>
  import { Slider, Stack } from "carbon-components-svelte";

  /** @type {"horizontal" | "vertical"} */
  export let orientation = "vertical";

  let gap = 5;
</script>

<div style="margin-bottom: 1.5rem">
  <Slider
    labelText="Gap"
    min={0}
    max={13}
    minLabel="0"
    maxLabel="13"
    bind:value={gap}
  />
</div>

<Stack {orientation} {gap}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>
