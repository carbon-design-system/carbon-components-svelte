<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
  import type { ComponentProps } from "svelte";

  export let toggled = false;
  export let readonly = false;
  export let id: ComponentProps<Toggle>["id"] = undefined;
  export let readonlyText: ComponentProps<Toggle>["readonlyText"] = undefined;
  export let onToggle: (toggled: boolean) => void = () => {};
</script>

<Toggle
  bind:toggled
  {readonly}
  {id}
  {readonlyText}
  labelText="Readonly toggle"
  on:toggle={(e) => onToggle(e.detail.toggled)}
/>
