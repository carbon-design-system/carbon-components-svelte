<svelte:options accessors />

<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";

  export let selected: string | undefined = undefined;
  export let showStandard = true;
  export let annual = false;
</script>

<TileGroup legendText="Plan" name="plan" bind:selected>
  <RadioTile value="lite">Lite</RadioTile>
  {#if showStandard}
    {#if annual}
      <RadioTile value="standard">Standard, billed annually</RadioTile>
    {:else}
      <RadioTile value="standard">Standard, billed monthly</RadioTile>
    {/if}
  {/if}
</TileGroup>
