<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";

  // The group's label is its legend, so map the contract's label props onto
  // it and give the group two checkboxes to carry the state.
  export let hideLabel = false;
</script>

<CheckboxGroup {...$$restProps} hideLegend={hideLabel}>
  <svelte:fragment slot="legendChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
  <Checkbox value="a" labelText="A" />
  <Checkbox value="b" labelText="B" />
</CheckboxGroup>
