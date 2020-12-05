<script>
  import { Toggle, Button } from "carbon-components-svelte";

  let toggled = true;
</script>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>

<Toggle labelText="Push notifications" bind:toggled />

<div>
  <Button size="small" on:click="{() => (toggled = !toggled)}">
    Toggle
    {toggled ? 'off' : 'on'}
  </Button>
</div>

<div>Toggled: {toggled}</div>
