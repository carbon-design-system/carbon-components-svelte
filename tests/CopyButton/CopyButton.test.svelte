<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let portalTooltip: ComponentProps<CopyButton>["portalTooltip"] =
    undefined;
</script>

<CopyButton
  text="text"
  iconDescription="Basic"
  {portalTooltip}
  on:copy={() => {
    console.log("copied");
  }}
/>

<CopyButton
  iconDescription="Custom feedback"
  text="text"
  feedback="Copied to clipboard"
  feedbackTimeout={0}
  {portalTooltip}
/>

<CopyButton
  text="Custom copy function"
  iconDescription="Custom copy function"
  copy={(text) => {
    console.log(`Custom copy: ${text}`);
  }}
  {portalTooltip}
/>
