<script>
  import { Button, Toggle } from "carbon-components-svelte";

  let toggled = true;
</script>

<Toggle labelText="Push notifications" bind:toggled />

<div>
  <Button size="small" on:click={() => (toggled = !toggled)}>
    Toggle
    {toggled ? "off" : "on"}
  </Button>
</div>

<div>Toggled: {toggled}</div>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>
