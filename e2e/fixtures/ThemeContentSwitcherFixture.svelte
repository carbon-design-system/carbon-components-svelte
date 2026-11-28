<script lang="ts">
  import { Theme, ThemeContentSwitcher } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/theme-labels.js";

  let theme: CarbonTheme = "white";
</script>

<Theme bind:theme />
<div data-testid="theme">{theme}</div>

<ThemeContentSwitcher data-testid="switcher" bind:theme />

<ThemeContentSwitcher
  bind:theme
  themes={["white", "g100"]}
  labelText="Color scheme"
  hideLabel
  size="sm"
  autoWidth
/>

<ThemeContentSwitcher bind:theme labelText="Locked theme" size="xl" disabled />
