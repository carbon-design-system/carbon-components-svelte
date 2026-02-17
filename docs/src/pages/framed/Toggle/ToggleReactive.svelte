<script>
  import { Button, Stack, Toggle } from "carbon-components-svelte";

  let toggled = true;
</script>

<Stack gap={5}>
  <Toggle labelText="Push notifications" bind:toggled />
  <div>
    <Button size="small" on:click={() => (toggled = !toggled)}>
      Toggle
      {toggled ? "off" : "on"}
    </Button>
  </div>
  <div>Toggled: {toggled}</div>
</Stack>
