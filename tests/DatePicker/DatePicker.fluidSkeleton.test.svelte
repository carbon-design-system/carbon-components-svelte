<script lang="ts">
  import FluidDatePickerSkeleton from "carbon-components-svelte/DatePicker/FluidDatePickerSkeleton.svelte";
</script>

<FluidDatePickerSkeleton
  data-testid="fluid-date-picker-skeleton"
  {...$$props}
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
