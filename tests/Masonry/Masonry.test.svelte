<script lang="ts">
  import Masonry from "carbon-components-svelte/Masonry/Masonry.svelte";
  import type { ComponentProps } from "svelte";

  export let heights: number[] = [100, 50, 80, 30];
  export let columns: ComponentProps<Masonry>["columns"] = undefined;
  export let columnWidth: ComponentProps<Masonry>["columnWidth"] = "16rem";
  export let gap: ComponentProps<Masonry>["gap"] = 5;
  export let native: ComponentProps<Masonry>["native"] = true;
  export let hideUntilPlaced: ComponentProps<Masonry>["hideUntilPlaced"] = false;
  export let tag: "div" | "ul" | "section" = "div";
  export let ref: HTMLElement | null = null;
</script>

<Masonry
  data-testid="masonry"
  class="custom"
  style="color: red"
  {columns}
  {columnWidth}
  {gap}
  {native}
  {hideUntilPlaced}
  {tag}
  bind:ref
>
  {#each heights as height, i}
    <div data-testid="item-{i}" data-height={height}>Item {i}</div>
  {/each}
</Masonry>
