<script>
  import { Checkbox, CheckboxGroup } from "carbon-components-svelte";

  let selected = [];
</script>

<CheckboxGroup
  data-testid="checkbox-group-options"
  legendText="Choose options"
  bind:selected
>
  <Checkbox value="a" labelText="Option A" />
  <Checkbox value="b" labelText="Option B" />
  <Checkbox value="c" labelText="Option C" />
</CheckboxGroup>

{#if selected.length > 0}
  <p data-testid="selected-values">Selected: {selected.join(", ")}</p>
{/if}
