<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  let theme: CarbonTheme = "white";
</script>

<Theme bind:theme persist persistKey="e2e-theme-key">
  <div data-testid="theme-display">{theme}</div>
  <button
    type="button"
    data-testid="set-g100"
    on:click={() => (theme = "g100")}
  >
    Set g100
  </button>
  <button
    type="button"
    data-testid="set-white"
    on:click={() => (theme = "white")}
  >
    Set white
  </button>
</Theme>
