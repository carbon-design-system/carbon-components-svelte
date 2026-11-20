<script lang="ts">
  import CurrencyInput from "carbon-components-svelte/CurrencyInput/CurrencyInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let props: Partial<ComponentProps<CurrencyInput>> = {};
  export let events = 0;
  export let changes: unknown[] = [];
</script>

<form data-testid="form">
  <CurrencyInput
    labelText="Amount"
    currency="USD"
    {...props}
    bind:value
    on:input={() => (events += 1)}
    on:change={(e) => (changes = [...changes, e.detail])}
  />
  <button type="reset">Reset</button>
</form>
<p data-testid="bound">{JSON.stringify(value)}</p>
<p data-testid="events">{events}</p>
<p data-testid="changes">{JSON.stringify(changes)}</p>
<button type="button" on:click={() => (value = "250.5")}>Set</button>
