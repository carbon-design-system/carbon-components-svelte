<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";

  export let groupName: string | undefined = undefined;
</script>

<form data-testid="form">
  <RadioButtonGroup name={groupName} legendText="Plan" selected="pro">
    <RadioButton name="plan" value="free" labelText="Free" />
    <RadioButton name="plan" value="pro" labelText="Pro" />
  </RadioButtonGroup>
</form>
