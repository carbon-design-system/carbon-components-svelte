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
