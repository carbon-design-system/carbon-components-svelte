<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<CheckboxGroup
  form="outer-form"
  name="fruit"
  selected={["apple", "pear"]}
  legendText="Fruit"
>
  <Checkbox value="apple" labelText="Apple" />
  <Checkbox value="kiwi" labelText="Kiwi" />
  <Checkbox value="pear" labelText="Pear" />
</CheckboxGroup>
