<script lang="ts">
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

<div
  data-testid="toggle-row"
  style:display="inline-flex"
  style:align-items="center"
>
  <Toggle
    size="sm"
    labelText="Live prices"
    hideLabel
    labelA="Paused"
    labelB="Live"
  />
  <span data-testid="toggle-row-neighbor">Updated 2 min ago</span>
</div>
<div data-testid="toggle-label-end">
  <Toggle labelPosition="end" labelText="Simulate loading" />
</div>
<div data-testid="toggle-label-end-sm">
  <Toggle size="sm" labelPosition="end" labelText="Simulate loading" />
</div>
