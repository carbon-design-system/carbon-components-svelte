<script>
  import { Text, Theme } from "carbon-components-svelte";

  let theme = "white";
</script>

<Theme
  persist
  persistKey="theme-fallback"
  system="fallback"
  render="toggle"
  bind:theme
/>

<Text>Current theme: {theme}</Text>
