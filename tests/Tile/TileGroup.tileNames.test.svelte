<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";

  export let groupName: string | undefined = undefined;
</script>

<form data-testid="form">
  <TileGroup name={groupName} legendText="Plan" selected="pro">
    <RadioTile name="plan" value="free">Free</RadioTile>
    <RadioTile name="plan" value="pro">Pro</RadioTile>
  </TileGroup>
</form>
