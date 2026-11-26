<script>
  import { Theme, ThemeSelect } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme bind:theme />
<ThemeSelect
  bind:theme
  themes={["white", "g90", "g100"]}
  labelText="Select a theme"
  inline
/>
