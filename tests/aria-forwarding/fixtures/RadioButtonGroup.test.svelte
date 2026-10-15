<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
</script>

<RadioButtonGroup legendText="Plan" readonly {...$$restProps}>
  <RadioButton labelText="Free" value="free" />
  <RadioButton labelText="Pro" value="pro" />
</RadioButtonGroup>
