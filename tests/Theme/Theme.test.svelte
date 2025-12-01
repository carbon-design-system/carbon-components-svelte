<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  export let theme: CarbonTheme = "white";
  export let persist = false;
  export let tokens = {};
</script>

<div data-testid="theme-wrapper">
  <Theme
    {theme}
    {persist}
    {tokens}
    on:update={({ detail }) => {
      console.log("update", detail);
    }}
  >
    <slot />
  </Theme>
</div>
