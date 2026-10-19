<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";

  // The group's label is its legend, so map the contract's label props onto
  // it and give the group two radios to carry the state.
  export let hideLabel = false;
</script>

<RadioButtonGroup {...$$restProps} hideLegend={hideLabel}>
  <svelte:fragment slot="legendChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
  <RadioButton value="a" labelText="A" />
  <RadioButton value="b" labelText="B" />
</RadioButtonGroup>
