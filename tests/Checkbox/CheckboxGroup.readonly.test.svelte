<svelte:options accessors />

<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: string[] = ["1"];
  export let readonly = false;
  export let id: ComponentProps<CheckboxGroup>["id"] = undefined;
  export let readonlyText: ComponentProps<CheckboxGroup>["readonlyText"] =
    undefined;
</script>

<CheckboxGroup
  legendText="Options"
  {readonly}
  {id}
  {readonlyText}
  bind:selected
  on:change={(e) => console.log("change", e.detail)}
>
  <Checkbox labelText="Option 1" value="1" />
  <Checkbox labelText="Option 2" value="2" />
  <Checkbox labelText="Option 3" value="3" />
</CheckboxGroup>
