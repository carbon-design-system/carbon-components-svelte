<svelte:options accessors />

<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";

  export let checkedA = false;
  export let checkedB = false;
  export let checkedSolo = false;
</script>

<form data-testid="form">
  <RadioTile value="a" name="plan" bind:checked={checkedA}>A</RadioTile>
  <RadioTile value="b" name="plan" bind:checked={checkedB}>B</RadioTile>
  <RadioTile value="solo" bind:checked={checkedSolo}>Solo</RadioTile>
</form>
