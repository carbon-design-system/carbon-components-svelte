<svelte:options accessors />

<script lang="ts">
  import { RadioButton, RadioButtonGroup } from "carbon-components-svelte";

  export let selected: string | undefined = "1";
  export let readonly = false;
</script>

<RadioButtonGroup
  legendText="Plan"
  {readonly}
  bind:selected
  on:change={(e) => console.log("change", e.detail)}
>
  <RadioButton labelText="Free" value="1" />
  <RadioButton labelText="Pro" value="2" />
  <RadioButton labelText="Team" value="3" />
</RadioButtonGroup>
