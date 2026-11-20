<script>
  import { BottomSheet, Button, Stack } from "carbon-components-svelte";

  let modalOpen = false;
  let docked = false;
</script>

<Stack gap={4} orientation="horizontal">
  <Button on:click={() => (modalOpen = true)}>Modal sheet</Button>
  <Button kind="tertiary" on:click={() => (docked = !docked)}
    >{docked ? "Hide" : "Show"} persistent sheet</Button
  >
</Stack>
<p>Narrow this frame below 42rem to see both as sheets.</p>

<BottomSheet bind:open={modalOpen} title="Share">
  <p>A centered dialog from the md breakpoint up, a sheet below it.</p>
</BottomSheet>

<BottomSheet
  bind:open={docked}
  modal={false}
  title="Nearby"
  snapPoints={["peek", "half", "full"]}
>
  <p>A panel on the inline-end edge from the md breakpoint up.</p>
</BottomSheet>
