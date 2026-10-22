<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";

  export let rounded = true;
  export let decorated = true;
</script>

{#if decorated}
  <Tile {rounded}><span slot="decorator">AI</span></Tile>
  <ClickableTile href="/details" {rounded}>
    <span slot="decorator">AI</span>
  </ClickableTile>
  <SelectableTile {rounded}><span slot="decorator">AI</span></SelectableTile>
  <RadioTile value="a" {rounded}><span slot="decorator">AI</span></RadioTile>
  <ExpandableTile {rounded}><span slot="decorator">AI</span></ExpandableTile>
{:else}
  <Tile {rounded} />
  <ClickableTile href="/details" {rounded} />
  <SelectableTile {rounded} />
  <RadioTile value="a" {rounded} />
  <ExpandableTile {rounded} />
{/if}
