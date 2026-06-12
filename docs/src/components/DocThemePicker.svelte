<script lang="ts">
  import { RadioButton, RadioButtonGroup } from "carbon-components-svelte";
  import { themes } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { DOC_THEMES, theme } from "../store";

  export let legendText = "Theme";
  export let orientation: "horizontal" | "vertical" = "vertical";
</script>

<RadioButtonGroup {orientation} {legendText} bind:selected={$theme}>
  {#each DOC_THEMES as value (value)}
    <RadioButton labelText={themes[value]} {value} />
  {/each}
</RadioButtonGroup>
