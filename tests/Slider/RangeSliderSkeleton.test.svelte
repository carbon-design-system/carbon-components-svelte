<script lang="ts">
  import RangeSliderSkeleton from "carbon-components-svelte/Slider/RangeSliderSkeleton.svelte";
</script>

<RangeSliderSkeleton
  data-testid="range-slider-skeleton"
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
