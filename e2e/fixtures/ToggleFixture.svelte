<script>
  import { Toggle } from "carbon-components-svelte";

  let toggled = false;
</script>

<div class="fixture-container">
  <Toggle
    data-testid="toggle-notifications"
    labelText="Enable notifications"
    bind:toggled
  />

  <Toggle
    data-testid="toggle-disabled"
    labelText="Disabled toggle"
    disabled={true}
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
