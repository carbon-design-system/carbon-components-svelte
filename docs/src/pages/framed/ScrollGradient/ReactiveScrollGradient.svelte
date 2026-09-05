<script>
  import {
    Button,
    Checkbox,
    ScrollGradient,
    Stack,
  } from "carbon-components-svelte";

  let itemCount = 3;
  let hideStartGradient = false;
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    <Button size="small" kind="tertiary" on:click={() => (itemCount += 1)}>
      Add item
    </Button>
    <Button
      size="small"
      kind="tertiary"
      disabled={itemCount === 0}
      on:click={() => (itemCount = Math.max(0, itemCount - 1))}
    >
      Remove item
    </Button>
  </Stack>
  <Checkbox labelText="Hide start gradient" bind:checked={hideStartGradient} />
  <ScrollGradient {hideStartGradient} style="height: 8rem">
    {#each Array(itemCount) as _, i}
      <p>Item {i + 1}</p>
    {/each}
  </ScrollGradient>
</Stack>
