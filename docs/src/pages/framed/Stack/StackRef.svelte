<script>
  import { Button, Stack } from "carbon-components-svelte";

  let ref = null;
  let height = null;
</script>

<Stack gap={6}>
  <Button kind="secondary" on:click={() => (height = ref?.offsetHeight)}>
    Measure stack
  </Button>
  <Stack bind:ref gap={3}>
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </Stack>
  <div>Height: {height === null ? "not measured" : `${height}px`}</div>
</Stack>
