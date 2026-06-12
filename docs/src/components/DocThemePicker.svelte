<script lang="ts">
  import { RadioButton, RadioButtonGroup } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { themes } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { theme } from "../store";

  export let legendText = "Theme";
  export let orientation: "horizontal" | "vertical" = "vertical";

  const URL_THEMES: readonly CarbonTheme[] = [
    "white",
    "g10",
    "g80",
    "g90",
    "g100",
  ];
</script>

<RadioButtonGroup {orientation} {legendText} bind:selected={$theme}>
  {#each URL_THEMES as value (value)}
    <RadioButton labelText={themes[value]} {value} />
  {/each}
</RadioButtonGroup>
