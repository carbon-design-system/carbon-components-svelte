<script>
  import { Text, Theme, ThemeToggle } from "carbon-components-svelte";

  /** @type {import("carbon-components-svelte/src/Theme/theme-labels.js").CarbonTheme} */
  let theme = "white";
</script>

<Theme persist persistKey="theme-fallback" system="fallback" bind:theme />
<ThemeToggle bind:theme />

<Text>Current theme: {theme}</Text>
