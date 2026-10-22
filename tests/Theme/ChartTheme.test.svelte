<script lang="ts">
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import ChartThemeReader from "./ChartThemeReader.test.svelte";
  import ChartThemeZone from "./ChartThemeZone.test.svelte";

  export let withTheme = false;
  export let theme: CarbonTheme = "white";
  export let zone: CarbonTheme = "g100";
  export let innerZone: CarbonTheme = "g80";
</script>

{#if withTheme}
  <Theme {theme} />
{/if}

<ChartThemeReader testid="page" />

<ChartThemeZone theme={zone}>
  <ChartThemeReader testid="zone" />
  <ChartThemeZone theme={innerZone}>
    <ChartThemeReader testid="inner-zone" />
  </ChartThemeZone>
</ChartThemeZone>
