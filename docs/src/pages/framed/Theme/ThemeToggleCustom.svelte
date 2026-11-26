<script>
  import { Theme, ThemeToggle } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme />
<ThemeToggle
  bind:theme
  themes={["g10", "g80"]}
  labelText="Enable dark mode"
  hideLabel
  labelA="Enable dark mode"
  labelB="Enable dark mode"
  size="sm"
/>
