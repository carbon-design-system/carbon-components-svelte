<svelte:options accessors />

<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  export let theme: CarbonTheme = "white";
  export let persist = true;
  export let persistKey = "theme";
</script>

<Theme
  bind:theme
  {persist}
  {persistKey}
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
