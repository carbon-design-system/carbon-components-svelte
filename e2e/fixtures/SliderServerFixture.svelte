<script>
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
</script>

<!-- Rendered on the server by e2e/slider-server.test.ts, and mounted here. -->
<div data-testid="plain-rtl" dir="rtl">
  <Slider labelText="Replicas" value={20} />
  <RangeSlider
    labelText="Window"
    value={20}
    valueUpper={70}
    marks={[{ value: 25 }]}
  />
</div>
<LayoutDirection dir="rtl">
  <div data-testid="plain-ltr" dir="ltr">
    <Slider labelText="Replicas" value={20} />
    <RangeSlider
      labelText="Window"
      value={20}
      valueUpper={70}
      marks={[{ value: 25 }]}
    />
  </div>
</LayoutDirection>
