<script lang="ts">
  import SliderSkeleton from "carbon-components-svelte/Slider/SliderSkeleton.svelte";
</script>

<SliderSkeleton
  data-testid="slider-skeleton"
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
