<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let portalTooltip: ComponentProps<CodeSnippet>["portalTooltip"] = true;
  export let feedbackTimeout = 100;
</script>

<CodeSnippet
  type="inline"
  code="npm install"
  copyLabel="Copy code"
  {portalTooltip}
  {feedbackTimeout}
/>
