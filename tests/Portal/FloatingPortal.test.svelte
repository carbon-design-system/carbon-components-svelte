<svelte:options accessors />

<script lang="ts">
  import FloatingPortal from "../../src/Portal/FloatingPortal.svelte";

  export let open = false;
  export let direction: "top" | "bottom" = "bottom";
  export let zIndex = 9200;
  export let anchor: HTMLElement | null = null;
  export let ref: HTMLElement | null = null;
  export let content = "Floating content";
</script>

<div data-testid="anchor" bind:this={anchor}>
  Anchor element
</div>

<FloatingPortal {anchor} {direction} {open} {zIndex} bind:ref>
  {content}
</FloatingPortal>
