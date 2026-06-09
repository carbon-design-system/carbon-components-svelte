<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"] = "multi";
  export let showMoreLess = true;
</script>

<div data-testid="bound-value">{showMoreLess}</div>

<CodeSnippet
  {type}
  bind:showMoreLess
  code={`node -v
npm -v
yarn -v`}
/>
