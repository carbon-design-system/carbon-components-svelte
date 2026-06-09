<svelte:options accessors />

<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";

  export let preventDefault = false;
  export let ref: null | HTMLFormElement = null;
</script>

<FluidForm
  bind:ref
  data-testid="fluid-form"
  on:submit={(e) => {
    if (preventDefault) {
      e.preventDefault();
    }
    console.log("submit", e);
  }}
>
  <FormGroup legendText="Checkboxes">
    <Checkbox id="checkbox-0" labelText="Checkbox Label" checked />
    <Checkbox id="checkbox-1" labelText="Checkbox Label" />
    <Checkbox id="checkbox-2" labelText="Checkbox Label" disabled />
  </FormGroup>
  <Button type="submit">Submit</Button>
</FluidForm>
