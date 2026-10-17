<script>
  import { Select, SelectItem } from "carbon-components-svelte";

  let selected = "";
</script>

<Select data-testid="select-country" labelText="Country" bind:selected>
  <SelectItem value="us" text="United States" />
  <SelectItem value="uk" text="United Kingdom" />
  <SelectItem value="ca" text="Canada" />
  <SelectItem value="de" text="Germany" />
</Select>

{#if selected}
  <p data-testid="selected-value">Selected: {selected}</p>
{/if}

<div data-testid="fluid-invalid" style="width: 320px">
  <Select fluid labelText="Region" invalid invalidText="Fix this value">
    <SelectItem value="eu" text="EU Germany" />
  </Select>
</div>
