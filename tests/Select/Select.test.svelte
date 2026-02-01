<script lang="ts">
  import { Select, SelectItem } from "carbon-components-svelte";

  export let selected: string | number | undefined = undefined;
  export let disabled = false;
  export let id = "test-select";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let hideLabel = false;
  export let labelText = "Select label";
  export let size: "sm" | "xl" | undefined = undefined;
  export let inline = false;
  export let light = false;
</script>

<Select
  bind:selected
  {disabled}
  {id}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {hideLabel}
  {labelText}
  {size}
  {inline}
  {light}
  on:change={() => console.log("change")}
  on:input={() => console.log("input")}
  on:update={(e) => console.log("update", e.detail)}
>
  <SelectItem value="option-1" text="Option 1" />
  <SelectItem value="option-2" text="Option 2" />
  <SelectItem value="option-3" text="Option 3" />
</Select>
