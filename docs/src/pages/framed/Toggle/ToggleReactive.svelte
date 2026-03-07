<script>
  import { Button, Stack, Toggle } from "carbon-components-svelte";

  let toggled = true;
</script>

<Stack gap={6}>
  <Toggle labelText="Push notifications" bind:toggled />
  <div>
    <Button kind="tertiary" size="small" on:click={() => (toggled = !toggled)}>
      Toggle
      {toggled ? "off" : "on"}
    </Button>
  </div>
</Stack>
