<script lang="ts">
  import LazyMount from "carbon-components-svelte/LazyMount/LazyMount.svelte";

  export let count = 1;
  export let eager = false;
  export let when: "visible" | "idle" = "visible";
  export let estimatedHeight: number | string | undefined = 200;
  export let onMount: (index: number) => void = () => {};
</script>

{#each Array.from({ length: count }) as _, i}
  <LazyMount
    {eager}
    {when}
    {estimatedHeight}
    data-testid="lazy-{i}"
    on:mount={() => onMount(i)}
  >
    <p>Content {i}</p>
    <span slot="placeholder">Loading {i}</span>
  </LazyMount>
{/each}
