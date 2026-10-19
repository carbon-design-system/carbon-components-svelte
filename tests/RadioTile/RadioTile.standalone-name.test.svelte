<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";

  export let checkedA = false;
  export let checkedB = false;
  export let nameB = "plan";
  export let showB = true;
</script>

<RadioTile value="a" name="plan" checked={checkedA}>A</RadioTile>
{#if showB}
  <RadioTile value="b" name={nameB} checked={checkedB}>B</RadioTile>
{/if}
