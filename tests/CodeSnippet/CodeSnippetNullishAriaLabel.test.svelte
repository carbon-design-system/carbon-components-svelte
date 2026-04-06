<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let ariaLabel: ComponentProps<CodeSnippet>["aria-label"] = undefined;
</script>

<CodeSnippet
  type="single"
  code="test"
  {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
/>
