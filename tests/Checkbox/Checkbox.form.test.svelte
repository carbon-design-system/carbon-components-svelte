<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import type { ComponentProps } from "svelte";

  export let checked: ComponentProps<Checkbox>["checked"] = false;
  export let readonly: ComponentProps<Checkbox>["readonly"] = false;
  export let onCheck: (event: CustomEvent<boolean>) => void = () => {};
</script>

<form data-testid="form">
  <Checkbox
    bind:checked
    {readonly}
    name="agree"
    labelText="Agree"
    on:check={onCheck}
  />
</form>
<p data-testid="bound">{String(checked)}</p>
