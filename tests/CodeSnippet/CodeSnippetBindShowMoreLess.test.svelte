<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  export let type: "single" | "inline" | "multi" = "multi";
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
