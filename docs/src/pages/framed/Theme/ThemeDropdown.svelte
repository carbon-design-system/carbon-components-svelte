<script>
  import { Theme, ThemeDropdown } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme />
<ThemeDropdown bind:theme />
