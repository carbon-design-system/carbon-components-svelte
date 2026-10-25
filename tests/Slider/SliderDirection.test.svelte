<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let context = true;
  /** A plain `dir` on an element between the LayoutDirection and the sliders. */
  export let innerDir: "ltr" | "rtl" | undefined = undefined;
</script>

{#if context}
  <LayoutDirection {dir}>
    <div dir={innerDir}>
      <Slider labelText="Replicas" value={20} />
      <RangeSlider
        labelText="Window"
        value={20}
        valueUpper={70}
        marks={[{ value: 25 }]}
      />
    </div>
  </LayoutDirection>
{:else}
  <Slider labelText="Replicas" value={20} />
  <RangeSlider
    labelText="Window"
    value={20}
    valueUpper={70}
    marks={[{ value: 25 }]}
  />
{/if}
