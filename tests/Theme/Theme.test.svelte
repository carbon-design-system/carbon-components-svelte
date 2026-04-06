<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let theme: ComponentProps<Theme>["theme"] = "white";
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
