<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<ToggleButtonGroup>["selected"] = [];
  export let selectionMode: ComponentProps<ToggleButtonGroup>["selectionMode"] =
    "multiple";
  export let firstDisabled = false;
  export let groupDisabled = false;
</script>

<ToggleButtonGroup
  {selected}
  {selectionMode}
  disabled={groupDisabled}
  labelText="Text formatting"
>
  <ToggleButton value="bold" disabled={firstDisabled}>Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>
