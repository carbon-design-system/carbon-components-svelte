<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";

  export let toggled = false;
  export let readonly = false;
</script>

<Toggle
  bind:toggled
  {readonly}
  labelText="Readonly toggle"
  on:toggle={(e) => console.log("toggle", e.detail.toggled)}
/>
