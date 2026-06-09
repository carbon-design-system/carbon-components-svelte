<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"] = "single";
</script>

<CodeSnippet {type} disabled code="npm install --save @carbon/icons" />
