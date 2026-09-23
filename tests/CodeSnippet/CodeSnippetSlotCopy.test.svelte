<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"] = "single";
  export let copy: ((code: string) => void | Promise<void>) | undefined =
    undefined;
  export let code: string | undefined = undefined;

  // Rendered through {@html} so formatting can't insert template whitespace,
  // which Svelte 3/4 keep and Svelte 5 collapses.
  const slotHtml = "<span>npm</span> i foo";
</script>

<CodeSnippet
  {type}
  {...copy ? { copy } : {}}
  {...code === undefined ? {} : { code }}
  >{@html slotHtml}</CodeSnippet
>
