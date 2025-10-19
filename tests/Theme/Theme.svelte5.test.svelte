<svelte:options accessors />

<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  export let theme: CarbonTheme = "white";
  export let persist = false;
  export let tokens = {};
  export let onupdate: ((e: CustomEvent) => void) | undefined = undefined;
</script>

<div data-testid="theme-wrapper">
  <Theme
    {theme}
    {persist}
    {tokens}
    onupdate={onupdate ||
      (({ detail }) => {
        console.log("update", detail);
      })}
  >
    <slot />
  </Theme>
</div>
