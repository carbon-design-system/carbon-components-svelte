<svelte:options accessors />

<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let theme: ComponentProps<Theme>["theme"] = "white";
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
