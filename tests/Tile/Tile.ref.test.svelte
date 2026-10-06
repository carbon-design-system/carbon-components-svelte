<svelte:options accessors />

<script lang="ts">
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
  import type { ComponentProps } from "svelte";

  export let ref: ComponentProps<Tile>["ref"] = null;
</script>

<Tile bind:ref>Usage summary</Tile>
