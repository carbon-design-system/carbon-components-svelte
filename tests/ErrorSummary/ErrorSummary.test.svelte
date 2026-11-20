<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
  import ErrorSummary from "carbon-components-svelte/ErrorSummary/ErrorSummary.svelte";
  import { collectFormErrors } from "carbon-components-svelte/ErrorSummary/collect-form-errors.js";
  import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { tick } from "svelte";
  import type { ComponentProps } from "svelte";

  export let errors: ComponentProps<ErrorSummary>["errors"] = [];
  export let focusOnShow = true;
  export let headingLevel: ComponentProps<ErrorSummary>["headingLevel"] = 2;
  export let invalid = false;
  export let onselect: (event: CustomEvent) => void = () => {};
  let collected: ReturnType<typeof collectFormErrors> = [];

  let form: HTMLFormElement;
  let summary: ErrorSummary;

  export async function collect() {
    await tick();
    collected = collectFormErrors(form);
    return collected;
  }
  export function focusSummary() {
    summary.focus();
  }
</script>

<form bind:this={form} data-testid="form">
  <ErrorSummary
    bind:this={summary}
    {errors}
    {focusOnShow}
    {headingLevel}
    on:select={(event) => onselect(event)}
  />
  <TextInput id="name" labelText="Name" {invalid} invalidText="Enter a name" />
  <TextInput id="email" labelText="Email" />
  <RadioButtonGroup
    id="plan"
    legendText="Plan"
    {invalid}
    invalidText="Choose a plan"
  >
    <RadioButton id="plan-a" value="a" labelText="A" />
    <RadioButton id="plan-b" value="b" labelText="B" />
  </RadioButtonGroup>
  <CheckboxGroup legendText="Topics" {invalid} invalidText="Pick a topic">
    <Checkbox id="topic-a" labelText="Topic A" />
    <Checkbox id="topic-b" labelText="Topic B" />
  </CheckboxGroup>
  <Slider id="volume" labelText="Volume" {invalid} invalidText="Too loud" />
  <FormGroup legendText="Address">
    <TextInput
      id="street"
      labelText="Street"
      {invalid}
      invalidText="Enter a street"
    />
    <TextInput
      id="city"
      labelText="City"
      {invalid}
      invalidText="Enter a city"
    />
  </FormGroup>
</form>
