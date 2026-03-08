<script>
  import { LocalStorage, TextInput } from "carbon-components-svelte";

  let value = "initial";
  let storage;
</script>

<LocalStorage key="e2e-local-storage-key" bind:value bind:this={storage} />

<div data-testid="display-value">{value}</div>

<TextInput data-testid="value-input" labelText="Value" bind:value hideLabel />

<button
  type="button"
  data-testid="clear-item"
  on:click={() => storage?.clearItem()}
>
  Clear item
</button>
<button
  type="button"
  data-testid="clear-all"
  on:click={() => storage?.clearAll()}
>
  Clear all
</button>
