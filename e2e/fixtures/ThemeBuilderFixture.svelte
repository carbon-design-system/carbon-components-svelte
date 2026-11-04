<script>
  import { ThemeBuilder } from "carbon-components-svelte";

  let base = "white";
  let tokens = {};
  let resolved = {};
  let changes = 0;
</script>

<div data-testid="host">
  <ThemeBuilder
    bind:base
    bind:tokens
    bind:resolved
    readHash
    on:change={() => changes++}
  />
  <output data-testid="state">{JSON.stringify({ base, tokens })}</output>
  <output data-testid="changes">{changes}</output>
  <output data-testid="resolved-count">{Object.keys(resolved).length}</output>
</div>
