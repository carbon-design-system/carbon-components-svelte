<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
</script>

<CheckboxGroup legendText="Options" readonly selected={["1"]}>
  <Checkbox labelText="Option 1" value="1" />
  <Checkbox
    labelText="Option 2"
    value="2"
    on:change={() => console.log("checkbox-change", "2")}
  />
</CheckboxGroup>
