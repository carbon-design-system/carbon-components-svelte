<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import type { ComponentProps } from "svelte";

  export let portalTooltip: ComponentProps<CopyButton>["portalTooltip"] = true;
  export let feedbackTimeout = 100;
</script>

<CopyButton
  text="text"
  iconDescription="Copy"
  {portalTooltip}
  {feedbackTimeout}
/>
