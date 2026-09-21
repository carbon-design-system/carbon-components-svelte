<svelte:options accessors />

<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";

  export let showMiddle = true;
</script>

<ToggleButtonGroup aria-label="Views">
  <ToggleButton value="a">A</ToggleButton>
  {#if showMiddle}
    <ToggleButton value="b">B</ToggleButton>
  {/if}
  <ToggleButton value="c">C</ToggleButton>
</ToggleButtonGroup>
