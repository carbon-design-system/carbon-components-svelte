<svelte:options accessors />

<script lang="ts">
  import { Checkbox, CheckboxGroup } from "carbon-components-svelte";

  export let selected: string[] = ["1"];
  export let readonly = false;
</script>

<CheckboxGroup
  legendText="Options"
  {readonly}
  bind:selected
  on:change={(e) => console.log("change", e.detail)}
>
  <Checkbox labelText="Option 1" value="1" />
  <Checkbox labelText="Option 2" value="2" />
  <Checkbox labelText="Option 3" value="3" />
</CheckboxGroup>
