<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
</script>

<RadioButtonGroup legendText="Plan" readonly selected="1">
  <RadioButton labelText="Free" value="1" />
  <RadioButton
    labelText="Pro"
    value="2"
    on:change={() => console.log("radio-change", "2")}
  />
</RadioButtonGroup>
