<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"];
  export let onMouseEnter = (_event: MouseEvent) => {};
</script>

<CodeSnippet
  {type}
  code="npm install --save @carbon/icons"
  on:mouseenter={onMouseEnter}
/>
