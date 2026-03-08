<script>
  import { Toggle } from "carbon-components-svelte";

  let toggled = false;
</script>

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
