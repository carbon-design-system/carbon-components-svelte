<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";

  export let tag: "div" | "section" = "div";

  let ref: HTMLElement | null = null;
</script>

<Box {tag} bind:ref>Anchor</Box>

<p data-testid="ref-tag">{ref?.tagName ?? "none"}</p>
