<script>
  import { Toggle } from "carbon-components-svelte";

  let toggled = true;
</script>

<Toggle
  labelText="Public link sharing"
  bind:toggled
  warn={toggled}
  warnText="Anyone with the link can view this workspace."
/>
