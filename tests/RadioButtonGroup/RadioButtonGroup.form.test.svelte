<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<RadioButtonGroup>["selected"] = undefined;
  export let readonly: ComponentProps<RadioButtonGroup>["readonly"] = false;
  export let onChange: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <RadioButtonGroup
    bind:selected
    {readonly}
    legendText="Pick one"
    on:change={onChange}
  >
    <RadioButton value="a" labelText="A" />
    <RadioButton value="b" labelText="B" />
  </RadioButtonGroup>
</form>
<p data-testid="bound">{String(selected)}</p>
