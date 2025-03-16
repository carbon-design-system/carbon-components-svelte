<script lang="ts">
  import { Toggle } from "carbon-components-svelte";

  let toggled = false;
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
