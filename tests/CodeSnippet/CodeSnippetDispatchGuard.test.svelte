<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let expanded: ComponentProps<CodeSnippet>["expanded"] = false;
  export let onExpand: () => void = () => {};
  export let onCollapse: () => void = () => {};
</script>

<CodeSnippet
  type="multi"
  bind:expanded
  code={`node -v
npm -v`}
  on:expand={onExpand}
  on:collapse={onCollapse}
/>
