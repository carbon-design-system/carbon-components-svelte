<script>
  import { Theme, ThemeContentSwitcher } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/src/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme />
<ThemeContentSwitcher bind:theme />
