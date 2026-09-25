<script lang="ts">
  import ScrollGradient from "carbon-components-svelte/ScrollGradient/ScrollGradient.svelte";

  let scrollElementRef: HTMLDivElement | null = null;
</script>

<ScrollGradient bind:scrollElementRef>
  <p>Content</p>
</ScrollGradient>

<p data-testid="scroll-element-class">
  {scrollElementRef?.className ?? "none"}
</p>
