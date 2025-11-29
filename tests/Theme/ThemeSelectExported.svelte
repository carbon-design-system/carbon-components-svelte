<script context="module" lang="ts">
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import { themes } from "carbon-components-svelte/Theme/Theme.svelte";

  export const lightThemes = (Object.keys(themes) as CarbonTheme[]).filter(
    (theme) => ["white", "g10"].includes(theme),
  );
</script>

<script lang="ts">
  import { Theme } from "carbon-components-svelte";
</script>
  
  <Theme
    render="select"
    select={{
      themes: lightThemes,
      labelText: "Light themes",
    }}
    on:update={({ detail }) => {
      console.log("update", detail);
    }}
  />
  