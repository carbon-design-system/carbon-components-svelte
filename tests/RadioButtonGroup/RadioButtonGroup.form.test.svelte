<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<RadioButtonGroup>["selected"] = undefined;
  export let readonly: ComponentProps<RadioButtonGroup>["readonly"] = false;
  export let allowDeselect = false;
  export let values: [string | number, string | number] = ["a", "b"];
  export let onChange: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <RadioButtonGroup
    bind:selected
    {readonly}
    {allowDeselect}
    legendText="Pick one"
    on:change={onChange}
  >
    <RadioButton value={values[0]} labelText="A" />
    <RadioButton value={values[1]} labelText="B" />
  </RadioButtonGroup>
</form>
<p data-testid="bound">{String(selected)}</p>
