<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  export let dir: "ltr" | "rtl" | undefined = undefined;
</script>

{#if dir}
  <LayoutDirection {dir} tag="section">
    <Slider labelText="Replicas" min={0} max={10} value={2} />
    <RangeSlider labelText="Window" min={0} max={10} value={2} valueUpper={6} />
  </LayoutDirection>
{:else}
  <Slider labelText="Replicas" min={0} max={10} value={2} />
  <RangeSlider labelText="Window" min={0} max={10} value={2} valueUpper={6} />
{/if}
