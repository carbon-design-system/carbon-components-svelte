<script lang="ts">
  import FluidTimePickerSkeleton from "carbon-components-svelte/TimePicker/FluidTimePickerSkeleton.svelte";

  export let isOnlyTwo = false;
</script>

<FluidTimePickerSkeleton
  data-testid="skeleton"
  {isOnlyTwo}
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
