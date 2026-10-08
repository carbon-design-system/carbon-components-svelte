<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<RadioButtonGroup
  form="outer-form"
  name="plan"
  selected="pro"
  legendText="Plan"
>
  <RadioButton value="free" labelText="Free" />
  <RadioButton value="pro" labelText="Pro" />
</RadioButtonGroup>
