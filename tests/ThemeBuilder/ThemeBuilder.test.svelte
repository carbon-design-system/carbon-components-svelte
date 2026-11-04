<script lang="ts">
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import ThemeBuilder from "carbon-components-svelte/ThemeBuilder/ThemeBuilder.svelte";
  import ThemeZone from "carbon-components-svelte/ThemeZone/ThemeZone.svelte";

  export let base: CarbonTheme = "white";
  export let tokens: Record<string, string> = {};
  export let persist = false;
  export let readHash = false;
  export let custom = false;

  let resolved: Record<string, string> = {};
  let changes = 0;
</script>

{#if custom}
  <ThemeBuilder
    bind:base
    bind:tokens
    bind:resolved
    {persist}
    {readHash}
    persistKey="test-theme-builder"
    on:change={() => changes++}
  >
    <svelte:fragment slot="preview" let:theme let:style>
      <ThemeZone {theme} {style} data-testid="custom-zone">Custom</ThemeZone>
    </svelte:fragment>
  </ThemeBuilder>
{:else}
  <ThemeBuilder
    bind:base
    bind:tokens
    bind:resolved
    {persist}
    {readHash}
    persistKey="test-theme-builder"
    on:change={() => changes++}
  />
{/if}

<output data-testid="base">{base}</output>
<output data-testid="tokens">{JSON.stringify(tokens)}</output>
<output data-testid="resolved">{JSON.stringify(resolved)}</output>
<output data-testid="changes">{changes}</output>
