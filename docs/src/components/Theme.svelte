<script>
  export let persist = false;
  export let persistKey = "carbon-theme";
  export const themes = ["white", "g10", "g80", "g90", "g100"];

  import { onMount, afterUpdate } from "svelte";
  import { theme } from "../store";

  const isValidTheme = (value) => themes.includes(value);

  onMount(() => {
    const persisted_theme = localStorage.getItem(persistKey);
    if (isValidTheme(persisted_theme)) theme.set(persisted_theme);
  });

  afterUpdate(() => {
    if (isValidTheme($theme)) {
      document.documentElement.setAttribute("theme", $theme);
      if (persist) localStorage.setItem(persistKey, $theme);
    }
  });
</script>

<slot />
