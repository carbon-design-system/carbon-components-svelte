<script lang="ts">
  import { RadioButton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<RadioButton>["value"] = "";
  export let checked: ComponentProps<RadioButton>["checked"] = false;
  export let disabled: ComponentProps<RadioButton>["disabled"] = false;
  export let required: ComponentProps<RadioButton>["required"] = false;
  export let labelPosition: ComponentProps<RadioButton>["labelPosition"] =
    "right";
  export let labelText: ComponentProps<RadioButton>["labelText"] = "Option 1";
  export let hideLabel: ComponentProps<RadioButton>["hideLabel"] = false;
  export let id: ComponentProps<RadioButton>["id"] = "ccs-test";
  export let name: ComponentProps<RadioButton>["name"] = "test-group";
  export let ref: ComponentProps<RadioButton>["ref"] = null;
</script>

<RadioButton
  bind:value
  {checked}
  {disabled}
  {required}
  {labelPosition}
  {labelText}
  {hideLabel}
  {id}
  {name}
  {ref}
  on:change={() => {
    console.log("change");
  }}
/>
