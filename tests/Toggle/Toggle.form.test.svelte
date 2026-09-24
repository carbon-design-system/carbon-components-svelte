<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
  import type { ComponentProps } from "svelte";

  export let toggled: ComponentProps<Toggle>["toggled"] = false;
  export let readonly: ComponentProps<Toggle>["readonly"] = false;
  export let onToggle: (event: CustomEvent<{ toggled: boolean }>) => void =
    () => {};
</script>

<form data-testid="form">
  <Toggle
    bind:toggled
    {readonly}
    name="notify"
    labelText="Notify"
    on:toggle={onToggle}
  />
</form>
