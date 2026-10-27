<script lang="ts">
  import type { TransitionConfig } from "svelte/transition";

  export let show = false;
  export let transition: (
    node: Element,
    params: Record<string, unknown>,
    options: { direction: "in" | "out" | "both" },
  ) => TransitionConfig;
  export let params: Record<string, unknown> = {};
</script>

{#if show}
  <div
    data-testid="target"
    in:transition|global={params}
    out:transition|global={params}
  >
    content
  </div>
{/if}
