<script lang="ts">
  import FluidDropdownSkeleton from "carbon-components-svelte/Dropdown/FluidDropdownSkeleton.svelte";
</script>

<FluidDropdownSkeleton
  data-testid="fluid-dropdown-skeleton"
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
