<script lang="ts">
  import { Toggle } from "carbon-components-svelte";

  let toggled = false;
  let initialToggled = true;
</script>

<Toggle
  bind:toggled
  labelText="Default toggle"
  on:toggle={(e) => {
    console.log("toggled:", e.detail.toggled);
  }}
/>

<Toggle labelText="Custom labels" labelA="Inactive" labelB="Active" />

<Toggle size="sm" labelText="Small toggle" />

<Toggle disabled labelText="Disabled toggle" />

<Toggle
  hideLabel
  labelText="Hidden label toggle"
  aria-label="Hidden label toggle"
/>

<Toggle
  bind:toggled={initialToggled}
  labelText="Initial toggled state"
  name="test-toggle"
  on:toggle={(e) => {
    console.log("initial toggled:", e.detail.toggled);
  }}
/>

<Toggle labelText="Custom name toggle" name="custom-name-toggle" />
