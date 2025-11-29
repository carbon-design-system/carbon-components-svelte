<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";

  export let themes: CarbonTheme[] = [];
  export let labelText = "Themes";
</script>

<Theme
  render="select"
  select={{
    themes,
    labelText,
  }}
  on:update={({ detail }) => {
    console.log("update", detail);
  }}
/>
