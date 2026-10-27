<script lang="ts">
  import type { TransitionConfig } from "svelte/transition";

  export let show = true;
  export let transition: (
    node: Element,
    params: Record<string, unknown>,
    options: { direction: "in" | "out" | "both" },
  ) => TransitionConfig;
  export let params: Record<string, unknown> = {};
  export let onOutroEnd: () => void = () => {};
</script>

{#if show}
  <div
    data-testid="target"
    transition:transition|global={params}
    on:outroend={onOutroEnd}
  >
    content
  </div>
{/if}
