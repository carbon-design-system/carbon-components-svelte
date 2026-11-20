<script>
  import { BottomSheet, Button, Stack } from "carbon-components-svelte";

  let open = true;
  let choice = "";
</script>

<Stack gap={4}>
  <Button on:click={() => (open = true)}>Photo options</Button>
  <p>{choice ? `You chose: ${choice}` : "Nothing chosen yet."}</p>
</Stack>

<!-- `breakpoint={false}` keeps this a sheet in a wide frame. -->
<BottomSheet
  bind:open
  title="Photo options"
  snapPoints={["content"]}
  breakpoint={false}
>
  <Stack gap={2}>
    {#each ["Share", "Duplicate", "Move to album"] as action}
      <Button
        kind="ghost"
        on:click={() => {
          choice = action;
          open = false;
        }}>{action}</Button
      >
    {/each}
    <Button
      kind="danger-ghost"
      on:click={() => {
        choice = "Delete";
        open = false;
      }}>Delete</Button
    >
  </Stack>
</BottomSheet>
