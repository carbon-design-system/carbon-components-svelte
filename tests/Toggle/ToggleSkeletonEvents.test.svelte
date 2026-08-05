<script lang="ts">
  import ToggleSkeleton from "carbon-components-svelte/Toggle/ToggleSkeleton.svelte";

  export let size = "default";
  export let labelText = "Toggle";
</script>

<ToggleSkeleton
  data-testid="skeleton"
  {size}
  {labelText}
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
