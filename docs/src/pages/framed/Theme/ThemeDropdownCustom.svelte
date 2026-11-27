<script>
  import { Theme, ThemeDropdown } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/src/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme />
<ThemeDropdown
  bind:theme
  themes={["white", "g90", "g100"]}
  labelText="Select a theme"
  type="inline"
/>
