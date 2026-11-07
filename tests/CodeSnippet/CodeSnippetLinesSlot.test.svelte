<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  // Rendered through {@html} so formatting can't insert template whitespace,
  // which Svelte 3/4 keep and Svelte 5 collapses.
  const slotHtml = "<span>from the slot</span>";
</script>

<CodeSnippet type="multi" code="from code" lineNumbers highlightLines="1"
  >{@html slotHtml}</CodeSnippet
>
