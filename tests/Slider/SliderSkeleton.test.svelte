<script lang="ts">
  import SliderSkeleton from "carbon-components-svelte/Slider/SliderSkeleton.svelte";
</script>

<SliderSkeleton
  data-testid="slider-skeleton"
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
