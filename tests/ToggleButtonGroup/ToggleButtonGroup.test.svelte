<svelte:options accessors />

<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<ToggleButtonGroup>["selected"] = [];
  export let selectionMode: ComponentProps<ToggleButtonGroup>["selectionMode"] =
    undefined;
  export let required: ComponentProps<ToggleButtonGroup>["required"] =
    undefined;
  export let size: ComponentProps<ToggleButtonGroup>["size"] = undefined;
  export let orientation: ComponentProps<ToggleButtonGroup>["orientation"] =
    undefined;
  export let disabled: ComponentProps<ToggleButtonGroup>["disabled"] = false;
  export let boldDisabled = false;
  export let labelText: ComponentProps<ToggleButtonGroup>["labelText"] =
    "Text formatting";
  export let ariaLabel: string | undefined = undefined;
</script>

<ToggleButtonGroup
  bind:selected
  {selectionMode}
  {required}
  {size}
  {orientation}
  {disabled}
  {labelText}
  aria-label={ariaLabel}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <ToggleButton value="bold" disabled={boldDisabled}>Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>
