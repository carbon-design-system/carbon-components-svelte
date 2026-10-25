<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  /** A plain `dir` around the sliders. */
  export let dir: "ltr" | "rtl";
  /** A LayoutDirection around that. */
  export let context: "ltr" | "rtl" | undefined = undefined;
</script>

{#if context}
  <LayoutDirection dir={context}>
    <div {dir}>
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
  <div {dir}>
    <Slider labelText="Replicas" value={20} />
    <RangeSlider
      labelText="Window"
      value={20}
      valueUpper={70}
      marks={[{ value: 25 }]}
    />
  </div>
{/if}
