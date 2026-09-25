<script lang="ts">
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";

  export let tag: "div" | "section" = "div";

  let ref: HTMLElement | null = null;
</script>

<Stack {tag} bind:ref>Anchor</Stack>

<p data-testid="ref-tag">{ref?.tagName ?? "none"}</p>
