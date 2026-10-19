<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";

  export let onChange: (event: Event) => void = () => {};
</script>

<CheckboxGroup legendText="Options" readonly selected={["1"]}>
  <Checkbox labelText="Option 1" value="1" />
  <Checkbox labelText="Option 2" value="2" on:change={onChange} />
</CheckboxGroup>
