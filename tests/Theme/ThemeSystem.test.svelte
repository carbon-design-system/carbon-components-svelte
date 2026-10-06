<svelte:options accessors />

<script lang="ts">
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import type { ComponentProps } from "svelte";

  export let system = true;
  export let systemThemes: ComponentProps<Theme>["systemThemes"] | undefined =
    undefined;
  export let persist = false;
  export let theme: ComponentProps<Theme>["theme"] = "white";
</script>

<Theme
  {system}
  {systemThemes}
  {persist}
  bind:theme
  on:update={(e) => console.log("update", e.detail)}
/>
